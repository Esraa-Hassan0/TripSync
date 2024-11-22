// import React from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import './Navbar.css'
import planeImage from '../../assets/plane.png';

const Navbar = () => {
    return (<>
        <nav className="navbar navbar-expand-sm navbar-light bg-light">
            
            <a className="navbar-brand mb-0 h4 mx-3" href="#">
            <img className='d-inline-block align-top mx-1 mt-1'
                   src={planeImage} width={20} height={20} />
                My Dream Place
            </a>
            <button className="navbar-toggler"
                type='button'
                data-toggle='collapse'
            >

            </button>
          <div className="collapse navbar-collapse">
                <ul className="navbar-nav m-2">
                    <li className="nav-item active mx-2">
                        <a href="#">Home</a></li>
                    
                        <li className="nav-item active mx-2">Discover</li>
                        <li className="nav-item active mx-2">Activities</li>
                        <li className="nav-item active mx-2">About</li>
                        <li className="nav-item active mx-2">Content</li>
                    </ul> 
            </div> 
            <div className="collapse navbar-collapse d-flex justify-content-end">
                
                    <button className="register btn btn-primary mx-1">register</button>
                    <button className="sign_in btn btn-outline-light mx-1">sign in</button>
                
                   {/* <ul className="navbar-nav m-2">
                        <li className="register nav-item active mx-2">Register</li>
                        <li className="sign_in nav-item active mx-2">Sign in</li>
                    </ul>   */}
            </div>
      </nav></>
  )
}

export default Navbar