/* eslint-disable react/jsx-props-no-spreading */
import '@styles/globals.scss';
import type { AppProps } from 'next/app';
// Next.js allows you to import CSS directly in .js files.
// It handles optimization and all the necessary Webpack configuration to make this work.
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { SSRProvider } from 'react-bootstrap';
import { SessionProvider } from 'next-auth/react';

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

import { CookiesProvider } from 'react-cookie';

// You change this configuration value to false so that the Font Awesome core SVG library
// will not try and insert <style> elements into the <head> of the page.
// Next.js blocks this from happening anyway so you might as well not even try.
// See https://fontawesome.com/v6/docs/web/use-with/react/use-with#next-js
config.autoAddCss = false;

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // In server-side rendered applications, a SSRProvider must wrap the application in order
  // to ensure that the auto-generated ids are consistent between the server and client.
  // https://react-bootstrap.github.io/getting-started/server-side-rendering/
  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <CookiesProvider>
      <SSRProvider>
        <SessionProvider session={session}>
          <Component {...pageProps} />
          <ToastContainer />
        </SessionProvider>
      </SSRProvider>
    </CookiesProvider>
  );
}

export default MyApp;
