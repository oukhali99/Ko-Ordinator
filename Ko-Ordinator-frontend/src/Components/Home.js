import React from 'react';
import { Link } from 'react-router-dom'

class Home extends React.Component
{
    render()
    {
        return (
            <div 
                style={{
                    marginTop: "15%", 
                    textAlign: "center"
                }}
            >
                <h1 
                    style={{
                        marginBottom: "20px"
                    }}
                >
                    Ko-Ordinator
                </h1>
                <Link 
                    to='/login' 
                    id="frontPageButton" 
                    style={{
                        fontSize: "20px"
                    }}
                >
                    Get Started
                </Link>
            </div>    
        );
    }
}
    
export default Home;
    