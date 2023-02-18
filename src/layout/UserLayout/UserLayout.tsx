import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useResizeDetector } from 'react-resize-detector';
import Head from 'next/head';
import Sidebar, { SidebarOverlay } from '@layout/UserLayout/Sidebar/Sidebar';
import Header from '@layout/UserLayout/Header/Header';
import Footer from '@layout/UserLayout/Footer/Footer';
import { Container } from 'react-bootstrap';

export default function UserLayout({ children }: PropsWithChildren) {
  // Show status for xs screen
  const [isShowSidebar, setIsShowSidebar] = useState(false);

  // Show status for md screen and above
  const [isShowSidebarMd, setIsShowSidebarMd] = useState(true);

  const toggleIsShowSidebar = () => {
    setIsShowSidebar(!isShowSidebar);
  };

  const toggleIsShowSidebarMd = () => {
    const newValue = !isShowSidebarMd;
    localStorage.setItem('isShowSidebarMd', newValue ? 'true' : 'false');
    setIsShowSidebarMd(newValue);
  };

  // Clear and reset sidebar
  const resetIsShowSidebar = () => {
    setIsShowSidebar(false);
  };

  const onResize = useCallback(() => {
    resetIsShowSidebar();
  }, []);

  const { ref } = useResizeDetector({ onResize });

  // On first time load only
  useEffect(() => {
    if (localStorage.getItem('isShowSidebarMd')) {
      setIsShowSidebarMd(localStorage.getItem('isShowSidebarMd') === 'true');
    }
  }, [setIsShowSidebarMd]);

  return (
    <>
      <Head>
        {/* } HTML Meta Tags */}
        <title>AWAP 2023 - Dashboard</title>
        <meta
          name="description"
          content="ACM@CMU presents Mars Makeover - explore, gather, and terraform with your algorithms to win!"
        />

        {/* Facebook Meta Tags */}
        <meta property="og:url" content="https://awap.acmatcmu.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AWAP 2023 - Dashboard" />
        <meta
          property="og:description"
          content="ACM@CMU presents Mars Makeover - explore, gather, and terraform with your algorithms to win!"
        />
        <meta property="og:image" content="https://i.imgur.com/FOGQVVh.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="awap.acmatcmu.com" />
        <meta property="twitter:url" content="https://awap.acmatcmu.com/" />
        <meta name="twitter:title" content="AWAP 2023 - Dashboard" />
        <meta
          name="twitter:description"
          content="ACM@CMU presents Mars Makeover - explore, gather, and terraform with your algorithms to win!"
        />
        <meta name="twitter:image" content="https://i.imgur.com/FOGQVVh.png" />

        {/*  Meta Tags Generated via https://www.opengraph.xyz */}
      </Head>

      <div ref={ref} className="position-absolute w-100" />

      <Sidebar isShow={isShowSidebar} isShowMd={isShowSidebarMd} />

      <div className="wrapper d-flex flex-column min-vh-100 bg-light">
        <Header
          toggleSidebar={toggleIsShowSidebar}
          toggleSidebarMd={toggleIsShowSidebarMd}
        />
        <div className="body flex-grow-1 px-3">
          <Container fluid="lg">{children}</Container>
        </div>
        <Footer />
      </div>

      <SidebarOverlay
        isShowSidebar={isShowSidebar}
        toggleSidebar={toggleIsShowSidebar}
      />
    </>
  );
}
