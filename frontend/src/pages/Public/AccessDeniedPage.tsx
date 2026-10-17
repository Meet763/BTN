import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AccessDeniedPage.css';

export const AccessDeniedPage: React.FC = () => {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Access denied';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="denied-shell">
      <p className="denied-code">403</p>
      <h1>Access denied</h1>
      <p className="denied-copy">
        You don’t have access to this page. If you were claiming a gift, go back to the form. Staff can sign in
        with an account.
      </p>
      <div className="denied-actions">
        <Link className="denied-primary" to="/gift">
          Gift form
        </Link>
        <Link className="denied-secondary" to="/login">
          Sign in
        </Link>
      </div>
    </div>
  );
};
