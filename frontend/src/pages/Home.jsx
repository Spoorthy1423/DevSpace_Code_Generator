import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import Select from 'react-select'
import { FaMagic } from 'react-icons/fa'
import { FiCopy, FiDownload, FiExternalLink, FiRefreshCw } from 'react-icons/fi'
import { GoogleGenAI } from '@google/genai'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'


const Home = ({ isDark, setIsDark }) => {
    const [activeTab, setActiveTab] = useState('code');
    const [code, setCode] = useState('');
    const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY});
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [output, setOutput] = useState(false);
    const [copyTooltip, setCopyTooltip] = useState('Copy');
    const [downloadTooltip, setDownloadTooltip] = useState('Download');
    const [previewKey, setPreviewKey] = useState(0);

    const options = [
        {value: 'html-css', label: 'HTML + CSS'},
        {value: 'html-tailwind', label: 'HTML + Tailwind CSS'},
        {value: 'html-bootstrap', label: 'HTML + Bootstrap'},
        {value: 'html-css-js', label: 'HTML + CSS + JS'},
        {value: 'html-tailwind-bootstrap', label: 'HTML + Tailwind + Bootstrap'},
    ]

    const [selectedOption, setSelectedOption] = useState(null);
    const [framework, setFramework] = useState(null);

    const handleChange = (selectedOption) => {
        setSelectedOption(selectedOption);
        setFramework(selectedOption);
        if (selectedOption) {
            console.log(`Framework: ${selectedOption.label} (${selectedOption.value})`);
        }
    }

    // Extract code from markdown code blocks using regex
    function extractCode(response) {
        // Regex to extract content inside triple backticks
        const match = response.match(/```(?:\w+)?\n?([\s\S]*?)```/);
        // If match found, return the captured content (code), otherwise return the trimmed response
        return match ? match[1].trim() : response.trim();
    }

    async function getResponse() {
        if (!prompt.trim()) {
            setError('Please describe your component first');
            return;
        }
        
        if (!selectedOption) {
            setError('Please select a framework first');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const fullPrompt = `You are an expert frontend developer specializing in ${selectedOption.label}. Generate a complete, production-ready, single-page component with beautiful styling.

Component Description: ${prompt}
Framework: ${selectedOption.label}

CRITICAL REQUIREMENTS:
1. Generate a SINGLE, COMPLETE HTML file that works standalone (include all CSS and JS inline if needed)
2. Code must be PROPERLY FORMATTED with correct indentation (2 or 4 spaces, be consistent)
3. Use modern, beautiful color schemes:
   - Primary colors: Use vibrant gradients (purple, blue, or teal)
   - Background: Use elegant dark or light themes with good contrast
   - Accent colors: Use complementary colors for buttons and highlights
4. Typography: Use modern, readable fonts (system fonts or Google Fonts)
5. Styling requirements:
   - Beautiful gradients, shadows, and hover effects
   - Smooth animations and transitions
   - Modern, clean design with proper spacing
   - Fully responsive (mobile, tablet, desktop)
   - Professional look and feel
6. Code quality:
   - Clean, well-structured, and easy to understand
   - Proper semantic HTML
   - Organized CSS (use CSS variables for colors)
   - Well-commented where necessary
   - Production-ready code
7. For signup/login pages specifically:
   - Beautiful form design with floating labels or modern input styles
   - Eye-catching call-to-action buttons
   - Social login options (styled buttons)
   - Password strength indicators
   - Smooth form validation styling
   - Professional color scheme (blues, purples, or teals work well)
8. Output format:
   - Return ONLY the complete code in a markdown code block
   - NO explanations, NO comments outside code, NO markdown text
   - Code must be immediately usable when copied
   - Ensure proper formatting with consistent indentation

Generate the most beautiful, well-formatted, single-page component possible.`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: fullPrompt
            });

            // Extract text from response
            let generatedCode = '';
            if (response.text) {
                generatedCode = response.text;
            } else if (response.response?.text) {
                generatedCode = response.response.text();
            } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                generatedCode = response.candidates[0].content.parts[0].text;
            }

            // Extract code from markdown blocks using extractCode function
            let extractedCode = extractCode(generatedCode);

            // Remove attributes that can cause blocked resources
            if (extractedCode) {
                extractedCode = extractedCode
                    .replace(/integrity="[^"]*"/gi, '')
                    .replace(/crossorigin="[^"]*"/gi, '')
                    .replace(/referrerpolicy="[^"]*"/gi, '');
            }

            // Set output to true and set code directly
            setOutput(true);
            setCode(extractedCode && extractedCode.trim() ? extractedCode : '// Code generation completed');
            setActiveTab('code');
        } catch (err) {
            console.error('API Error:', err);
            
            if (err.status === 429 || err.code === 429) {
                const retryDelay = err.details?.[0]?.retryDelay || 5;
                setError(`Rate limit exceeded. Please wait ${retryDelay} seconds before trying again.`);
                
                // Auto-retry after delay
                setTimeout(() => {
                    setError(null);
                    getResponse();
                }, retryDelay * 1000);
            } else if (err.message?.includes('quota')) {
                setError('API quota exceeded. Please check your billing or wait a few minutes.');
            } else {
                setError(err.message || 'Failed to generate code. Please try again.');
            }
        } finally {
            setIsGenerating(false);
        }
    }

    const handleCopy = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            setCopySuccess(true);
            setCopyTooltip('Copied to clipboard!!');
            setTimeout(() => {
                setCopySuccess(false);
                setCopyTooltip('Copy');
            }, 2000);
        }
    }

    const handleDownload = () => {
        if (code) {
            const blob = new Blob([code], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'DevSpace-Code.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setDownloadSuccess(true);
            setDownloadTooltip('Downloaded!!');
            setTimeout(() => {
                setDownloadSuccess(false);
                setDownloadTooltip('Download');
            }, 2000);
        }
    }

    const handleOpenPreview = () => {
        if (!(code && code.trim())) return;
        try {
            const blob = new Blob([code], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const previewWindow = window.open(url, '_blank', 'noopener,noreferrer');
            if (!previewWindow) {
                setError('Please allow popups to view the preview in a new tab.');
                setTimeout(() => setError(null), 3000);
            } else {
                // Release the blob URL once the new tab has loaded
                previewWindow.addEventListener('load', () => {
                    URL.revokeObjectURL(url);
                }, { once: true });
            }
        } catch (e) {
            setError('Failed to open preview in new tab.');
            setTimeout(() => setError(null), 3000);
        }
    }

    const handleRefreshPreview = () => {
        if (!(code && code.trim())) return;
        setPreviewKey((prev) => prev + 1);
    }

    const customStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: isDark ? '#141319' : '#ffffff',
            borderColor: isDark ? '#1f2937' : '#d1d5db',
            borderRadius: '8px',
            padding: '4px',
            minHeight: '45px',
            marginTop: '0',
            boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
            '&:hover': {
                borderColor: isDark ? '#374151' : '#9ca3af',
            },
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: isDark ? '#141319' : '#ffffff',
            border: isDark ? '1px solid #1f2937' : '1px solid #d1d5db',
            borderRadius: '8px',
            marginTop: '4px',
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected 
                ? '#4f46e5' 
                : state.isFocused 
                ? (isDark ? '#1f2937' : '#f3f4f6')
                : (isDark ? '#141319' : '#ffffff'),
            color: isDark ? '#fff' : '#1a1a1a',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: '#4f46e5',
            },
        }),
        singleValue: (base) => ({
            ...base,
            color: isDark ? '#fff' : '#1a1a1a',
        }),
        input: (base) => ({
            ...base,
            color: isDark ? '#fff' : '#1a1a1a',
        }),
        placeholder: (base) => ({
            ...base,
            color: '#9ca3af',
        }),
        indicatorSeparator: (base) => ({
            ...base,
            backgroundColor: isDark ? '#1f2937' : '#d1d5db',
        }),
        dropdownIndicator: (base) => ({
            ...base,
            color: '#9ca3af',
            '&:hover': {
                color: isDark ? '#fff' : '#1a1a1a',
            },
        }),
        clearIndicator: (base) => ({
            ...base,
            color: '#9ca3af',
            '&:hover': {
                color: isDark ? '#fff' : '#1a1a1a',
            },
        }), 
    }

    return (
        
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
            <Navbar isDark={isDark} setIsDark={setIsDark}/>
            <div className="flex items-start px-[100px] gap-4">
                <div className={`left w-[40%] h-[80vh] mt-5 p-[20px] rounded-lg flex flex-col overflow-y-auto gap-6 transition-colors duration-300 ${isDark ? 'bg-[#141319]' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className='flex flex-col gap-2'>
                        <h3 className='text-[25px] font-semibold sp-text'>AI Component Generator</h3>
                        <p className={`text-[14px] transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Describe your component in detail and let AI code for your </p>
                    </div>
                    
                    <div className='flex flex-col gap-3'>
                        <p className={`text-[15px] font-[700] transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Framework</p>
                        <Select 
                            value={selectedOption}
                            onChange={handleChange}
                            options={options}
                            styles={customStyles}
                            placeholder="Select an option..."
                            isSearchable={false}
                        />
                    </div>
                    
                    <div className='flex flex-col gap-3'>
                        <p className={`text-[15px] font-[700] transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Describe your component</p>
                        <textarea 
                            onChange={(e)=>{setPrompt(e.target.value)}} value={prompt}
                            className={`w-full min-h-[250px] rounded-lg p-4 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] resize-none transition-colors ${
                                isDark 
                                    ? 'bg-[#17171C] border border-[#1f2937] text-white' 
                                    : 'bg-white border border-gray-300 text-gray-900'
                            }`}
                            placeholder='Describe your component in detail...'
                        ></textarea>
                    </div>
                    
                    <div className='flex flex-col gap-2 mt-auto'>
                        <p className={`text-[13px] transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Click on generate button to generate your code</p>
                        {error && (
                            <div className='bg-red-900/20 border border-red-500/50 text-red-400 text-xs p-2 rounded-lg'>
                                {error}
                            </div>
                        )}
                        <div className='flex justify-end'>
                            <button 
                                onClick={getResponse}
                                disabled={isGenerating}
                                className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-purple-500/50 text-base min-w-[140px]'
                            >
                                {isGenerating ? (
                                    <>
                                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaMagic size={16} />
                                        <span>Generate</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                <div className={`right w-[60%] h-[80vh] mt-5 rounded-lg p-6 flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#141319]' : 'bg-gray-50 border border-gray-200'}`}>
                    {/* Tabs */}
                    <div className={`flex gap-6 border-b mb-6 pb-2 transition-colors ${isDark ? 'border-[#1f2937]' : 'border-gray-300'}`}>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={`pb-2 px-1 font-semibold text-sm transition-colors ${
                                activeTab === 'code' 
                                    ? 'text-purple-500 border-b-2 border-purple-500' 
                                    : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Code
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`pb-2 px-1 font-semibold text-sm transition-colors ${
                                activeTab === 'preview' 
                                    ? 'text-purple-500 border-b-2 border-purple-500' 
                                    : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Preview
                        </button>
                    </div>
                    
                    {/* Code Editor Section */}
                    {activeTab === 'code' && (
                        <div className='flex-1 flex flex-col gap-3 relative'>
                            <div className='flex items-center justify-between'>
                                <p className={`text-[15px] font-[700] transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Code Editor</p>
                                <div className='flex gap-2'>
                                    <button 
                                        onClick={handleCopy}
                                        disabled={isGenerating || !(code && code.trim())}
                                        className='p-2.5 hover:bg-[#1f2937] rounded-lg transition-colors border border-transparent hover:border-[#374151] disabled:opacity-50 disabled:cursor-not-allowed relative group' 
                                        title={copyTooltip}
                                        onMouseEnter={() => !copySuccess && setCopyTooltip('Copy')}
                                    >
                                        <FiCopy className='text-gray-400 hover:text-white' size={18} />
                                        {copySuccess && (
                                            <span className='absolute -top-9 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap'>
                                                Copied to clipboard!!
                                            </span>
                                        )}
                                    </button>
                                    <button 
                                        onClick={handleDownload}
                                        disabled={isGenerating || !(code && code.trim())}
                                        className='p-2.5 hover:bg-[#1f2937] rounded-lg transition-colors border border-transparent hover:border-[#374151] disabled:opacity-50 disabled:cursor-not-allowed relative group' 
                                        title={downloadTooltip}
                                        onMouseEnter={() => !downloadSuccess && setDownloadTooltip('Download')}
                                    >
                                        <FiDownload className='text-gray-400 hover:text-white' size={18} />
                                        {downloadSuccess && (
                                            <span className='absolute -top-9 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap'>
                                                Downloaded!!
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className={`flex-1 ${isDark ? 'bg-[#1e1e1e] border border-[#3e3e3e]' : 'bg-gray-100 border border-gray-300'} rounded-lg overflow-hidden shadow-2xl relative`}>
                                {isGenerating ? (
                                    <div className='h-full flex items-center justify-center'>
                                        <div className='flex flex-col items-center gap-4'>
                                            <div className='relative w-16 h-16'>
                                                <div className='absolute inset-0 border-4 border-purple-500/20 rounded-full'></div>
                                                <div className='absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin'></div>
                                            </div>
                                            <div className='flex gap-1'>
                                                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Generating code</span>
                                                <span className='animate-pulse'>...</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : !(code && code.trim()) ? (
                                    <div className='h-full flex items-center justify-center'>
                                        <div className='flex flex-col items-center gap-4'>
                                            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                                                <span className={`text-4xl ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>&lt;/&gt;</span>
                                            </div>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your component & code will appear here.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`flex-1 overflow-hidden rounded-lg ${isDark ? 'border border-[#3e3e3e]' : 'border border-gray-300'}`} style={{ minHeight: '400px' }}>
                                        <SyntaxHighlighter
                                            language="html"
                                            style={isDark ? vscDarkPlus : vs}
                                            customStyle={{
                                                margin: 0,
                                                height: '100%',
                                                padding: '16px',
                                                background: isDark ? '#1e1e1e' : '#ffffff',
                                                fontSize: '13px',
                                                lineHeight: '22px',
                                                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                                overflowX: 'auto'
                                            }}
                                            lineNumberStyle={{
                                                minWidth: '40px',
                                                textAlign: 'right',
                                                marginRight: '16px',
                                                color: isDark ? '#858585' : '#6b7280'
                                            }}
                                            showLineNumbers
                                            wrapLongLines
                                        >
                                            {code}
                                        </SyntaxHighlighter>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                    
                    {/* Preview Section */}
                    {activeTab === 'preview' && (
                        <div className='flex-1 flex flex-col gap-4'>
                            <div className='flex items-center justify-between'>
                                <p className={`text-[15px] font-[700] transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Preview</p>
                                <div className='flex gap-2'>
                                    <button
                                        onClick={handleOpenPreview}
                                        disabled={isGenerating || !(code && code.trim())}
                                        className='p-2.5 hover:bg-[#1f2937] rounded-lg transition-colors border border-transparent hover:border-[#374151] disabled:opacity-50 disabled:cursor-not-allowed'
                                        title='Open full preview in new tab'
                                    >
                                        <FiExternalLink className='text-gray-400 hover:text-white' size={18} />
                                    </button>
                                    <button
                                        onClick={handleRefreshPreview}
                                        disabled={isGenerating || !(code && code.trim())}
                                        className='p-2.5 hover:bg-[#1f2937] rounded-lg transition-colors border border-transparent hover:border-[#374151] disabled:opacity-50 disabled:cursor-not-allowed'
                                        title='Refresh preview'
                                    >
                                        <FiRefreshCw className='text-gray-400 hover:text-white' size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className={`flex-1 ${isDark ? 'bg-[#17171C] border border-[#1f2937]' : 'bg-gray-100 border border-gray-300'} rounded-lg overflow-hidden`}>
                                {!(code && code.trim()) ? (
                                    <div className='h-full flex items-center justify-center'>
                                        <p className='text-gray-500 text-sm'>Generate code to see preview</p>
                                    </div>
                                ) : (
                                    <iframe
                                        key={previewKey}
                                        srcDoc={code}
                                        className='w-full h-full border-0'
                                        title='Component Preview'
                                        sandbox='allow-scripts allow-same-origin'
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
 

export default Home;