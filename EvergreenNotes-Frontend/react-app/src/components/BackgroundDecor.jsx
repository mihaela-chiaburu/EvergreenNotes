import decor1 from "../assets/images/decor1.png"
import decor2 from "../assets/images/decor2.png"
import decor3 from "../assets/images/decor3.png"
import decor4 from "../assets/images/decor4.png"
import decor5 from "../assets/images/decor5.png"
import decor6 from "../assets/images/decor6.png"
import decor7 from "../assets/images/decor7.png"
import decor8 from "../assets/images/decor8.png"
import "../styles/background-decor.css"

function BackgroundDecor() {
  return (
    <>
      <div className="space-sky" aria-hidden="true">
        <div className="space-sky__stars"></div>

        <div className="space-sky__halo space-sky__halo--1"></div>
        <div className="space-sky__beam space-sky__beam--1"></div>

        <div className="space-sky__halo space-sky__halo--2"></div>
        <div className="space-sky__beam space-sky__beam--2"></div>

        <div className="space-sky__halo space-sky__halo--3"></div>
        <div className="space-sky__beam space-sky__beam--3"></div>
      </div>

      <div className="side-decor" aria-hidden="true">
        <img className="side-decor__item side-decor__item--left side-decor__item--1" src={decor1} alt="" />
        <img className="side-decor__item side-decor__item--left side-decor__item--2" src={decor2} alt="" />
        <img className="side-decor__item side-decor__item--left side-decor__item--3" src={decor3} alt="" />
        <img className="side-decor__item side-decor__item--left side-decor__item--4" src={decor4} alt="" />
        <img className="side-decor__item side-decor__item--right side-decor__item--5" src={decor5} alt="" />
        <img className="side-decor__item side-decor__item--right side-decor__item--6" src={decor6} alt="" />
        <img className="side-decor__item side-decor__item--right side-decor__item--7" src={decor7} alt="" />
        <img className="side-decor__item side-decor__item--right side-decor__item--8" src={decor8} alt="" />
      </div>
    </>
  )
}

export default BackgroundDecor
