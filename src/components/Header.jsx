import './Header.css';

export default function Header() {
  return (
    <>
      <div className="top-bar">
        <div className="left-text">GOVERNMENT OF INDIA</div>
        <div className="right-icons">
          <a href="#maincontent" className="top-link skip-link">Skip to main content</a>
          <span className="separator">|</span>
          <a href="#" className="top-link" aria-label="Increase font size">A+</a>
          <a href="#" className="top-link" aria-label="Normal font size">A</a>
          <a href="#" className="top-link" aria-label="Decrease font size">A-</a>
          <span className="separator">|</span>
          <a href="#" className="top-link">हिंदी</a>
          <span className="separator">|</span>
          <a href="#" className="top-link">English</a>
        </div>
      </div>

      <div className="main-header">
        <div className="header-left">
          <img
            src="https://www.mha.gov.in/themes/custom/mhanew/images/emblem-dark.png"
            alt="National Emblem of India"
            className="logo"
          />
          <div>
            <h3 className="hindi-title">गृह मंत्रालय</h3>
            <h2 className="english-title">
              MINISTRY OF <br /> <span className="home-affairs">HOME AFFAIRS</span>
            </h2>
          </div>
        </div>

        <div className="header-right">
          <img
            src="https://cdnbbsr.s3waas.gov.in/s3dcf6070a4ab7f3afbfd2809173e0824b/uploads/2024/12/20241206946318286.svg"
            alt="Digital India Initiative"
            className="icon"
          />
          <img
            src="https://tse4.mm.bing.net/th/id/OIP.sml1VGhU-CgNKUq2cmls2wHaHa?cb=12&w=3000&h=3000&rs=1&pid=ImgDetMain&o=7&rm=3"
            alt="Yoga"
            className="icon"
          />
          <img
            src="https://tse4.mm.bing.net/th/id/OIP.CIlriGQk07AwfJLLJF9wGgHaE8?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"
            alt="Cyber Dost Security Awareness"
            className="icon"
          />
        </div>
      </div>
    </>
  );
}