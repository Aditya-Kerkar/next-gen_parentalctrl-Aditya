import React, { useState, useEffect } from 'react';


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
        <div className="logo">Next-Gen Parental Ctrl</div>
        <ul className="nav-links">
          <li><a href="#about">Dashboard</a></li>
          <li><a href="#analytics">Analytics</a></li>
          <li><a href="#gamification">Gamification</a></li>
        </ul>
      </nav>
    </>
  );
}

export default Header;
