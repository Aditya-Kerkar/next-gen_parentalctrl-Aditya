import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav id="desktop-nav" className={isScrolled ? 'scrolled' : ''}>
        <div className="logo">
          <img src={isScrolled ? "/shield-check-white.png" : "/shield-check.png"} alt="Shield Check Icon" className="icon" />
          Next-Gen Parental Ctrl
        </div>
        <ul className="nav-links">
          <li><Link to="/">Dashboard</Link></li>
          <li><a href="/analytics">Analytics</a></li>
          <li><Link to="/requests">Requests</Link></li>
        </ul>
      </nav>
    </>
  );
}

export default Header;
