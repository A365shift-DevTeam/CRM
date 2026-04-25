import React from 'react';
import './PageHeader.css';

export default function PageHeader({ title, description, icon: Icon, iconColor = '#4361EE' }) {
    return (
        <div className="page-header">
            <h2>
                {Icon && <Icon style={{ color: iconColor }} />} 
                {title}
            </h2>
            {description && <p>{description}</p>}
        </div>
    );
}
