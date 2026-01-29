import React from 'react';

const ChannelingLoader = ({ message = "Channeling..." }) => {
    return (
        <div className="channeling-container">
            <div className="channeling-text">{message}</div>
            <div className="channeling-bar-wrapper">
                <div className="channeling-bar"></div>
            </div>
        </div>
    );
};

export default ChannelingLoader;
