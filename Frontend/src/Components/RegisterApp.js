import React from 'react';
import img1 from '../res/images/1.png';
import img2 from '../res/images/2.png';

export default class RegisterApp extends React.Component
{
    render()
    {
        return (
            <div
                style={{
                    textAlign: "center",
                    marginTop: "100px",
                    marginBottom: "100px"
                }}
            >
                <h1
                    style={{
                        fontSize: "7vh",
                        marginBottom: "5%"
                    }}
                >
                    Get the Register App on your IOS device!
                </h1>

                <div
                    style={{
                        padding: "1.5%",
                        backgroundColor: "#51555a",
                        display: "inline-block",
                        marginRight: "5%",
                        borderRadius: "1%",
                        width: "30%"
                    }}
                >
                    <img 
                        src={img1} 
                        alt="" 
                        style={{
                            borderRadius: "5%",
                            width: "100%"
                        }}                    
                    />
                </div>
                
                <div
                    style={{
                        padding: "1.5%",
                        backgroundColor: "#51555a",
                        display: "inline-block",
                        marginLeft: "5%",
                        borderRadius: "1%",
                        width: "30%"
                    }}
                >
                    <img 
                        src={img2} 
                        alt=""
                        style={{
                            borderRadius: "5%",
                            width: "100%"
                        }}
                        />
                </div>
            </div>
        );
    }
}