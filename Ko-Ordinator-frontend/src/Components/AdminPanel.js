import React from 'react';
import axios from 'axios';

export default class AdminPanel extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {display: '', password: ''};
        this.export = this.export.bind(this);
        this.changeHandler = this.changeHandler.bind(this);
    }
    
    export(e)
    {
        e.preventDefault();
        axios.post(process.env.REACT_APP_SERVER_URL + '/logs/export', {password: this.state.password})
            .then(res => {
                this.setState({display: res.data.message});
            })
            .catch(err => this.setState({display: err.toString()}));
    }

    changeHandler(e)
    {
        this.setState({password: e.target.value});
    }

    render()
    {
        return (
            <form className="form-group" onSubmit={this.export} style={{width: "90%", marginLeft: "5%"}}>
                <label>Admin password:</label>
                <input className="form-control" type="password" value={this.state.password} onChange={this.changeHandler} style={{marginBottom: "30px"}}/>
                <input className="form-control" type="submit" value="Export" style={{float: "right", width: "80px", marginLeft: "20px"}}/>
                
                <div style={{textAlign: "center", color: "red"}}>
                    {this.state.display}
                </div>
            </form>
        );
    }
}
