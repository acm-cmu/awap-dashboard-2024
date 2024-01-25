import React from 'react';

export default function Footer() {
  return (
    <footer className='footer flex-column flex-md-row border-top d-flex align-items-center justify-content-between px-4 py-2'>
      <div>
        <a className='text-decoration-none' href='http://acmatcmu.com/'>
          Algorithms with a Purpose
        </a>{' '}
        © 2024 ACM@CMU.
      </div>
    </footer>
  );
}
