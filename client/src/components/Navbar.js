import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path>
        </svg>
      )
    },
    {
      name: 'Leads',
      path: '/leads',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      )
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"></path>
        </svg>
      )
    },
    {
      name: 'Reports & Automation',
      path: '/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      )
    }
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-darkBorder glass-panel bg-opacity-80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Branding */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                A
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:opacity-95 transition-opacity">
                ANTIGRAVITY<span className="text-indigo-400 font-semibold text-sm ml-0.5">CRM</span>
              </span>
            </Link>
          </div>

          {/* Nav Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-indigo-600/10 text-white border-b-2 border-indigo-500 rounded-b-none'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>

          {/* User profile & controls */}
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-pulse-slow">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              SIMULATOR ACTIVE
            </div>

            {/* Profile Dropdown Trigger */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-sm font-medium text-white">{user.name}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{user.role}</span>
              </div>
              
              {/* User Avatar Circle */}
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Signout Button */}
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile nav indicator bar */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 py-1 bg-darkBg/90">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center py-1.5 px-3 rounded-md text-[10px] font-medium transition-all ${
              isActive(item.path)
                ? 'text-indigo-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {item.icon}
            <span className="mt-0.5">{item.name.split(' ')[0]}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
