import React from 'react';
import Sidebar from './Sidebar';
import TopNav from '../components/TopNav';
import './Layout.css';

export default function Layout({ children, activeScreen, setActiveScreen, title, subtitle }) {
  return (
    <div className="app-layout">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <div className="main-area">
        <TopNav title={title} subtitle={subtitle} />
        <main className="content-area">
          {React.cloneElement(children, { setActiveScreen })}
        </main>
      </div>
    </div>
  );
}
