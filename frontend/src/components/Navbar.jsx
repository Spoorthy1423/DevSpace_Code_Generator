import React from 'react'
import { FaUser } from 'react-icons/fa'
import { HiSun, HiMoon } from 'react-icons/hi'
import { RiSettings3Fill } from 'react-icons/ri'

const Navbar = ({ isDark, setIsDark }) => {
  const toggleTheme = () => {
    setIsDark(!isDark);
  }

  return (
    <div className={`nav flex items-center justify-between px-[100px] h-[90px] border-b-[1px] transition-colors ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="logo">
        <h3 className='text-[25px] font-[700] sp-text'>DevSpace</h3>
      </div>
      <div className="icons flex items-center gap-[15px]">
        <div 
          className="icon" 
          onClick={toggleTheme} 
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onMouseEnter={(e) => {
            e.currentTarget.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
          }}
        >
          {isDark ? <HiSun /> : <HiMoon />}
        </div>
        <div className="icon"><FaUser /></div>
        <div className="icon"><RiSettings3Fill /></div>
      </div>
    </div>
  )
}

export { Navbar }
export default Navbar
