import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import HeaderProfileNav from '@layout/UserLayout/Header/HeaderProfileNav';
import { Button, Container } from 'react-bootstrap';
import { useSession, signIn } from 'next-auth/react';

function Greeting() {
  const { data: session, status } = useSession();

  if (status === 'authenticated') {
    return (
      <div>
        Hello <strong>{session.user?.name}</strong>
      </div>
    );
  }
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  return <div>AWAP 2024</div>;
}

function Profile() {
  const { data: session, status } = useSession();

  if (status === 'authenticated') {
    if (!session.user.image) return <HeaderProfileNav img='0' />;
    return <HeaderProfileNav img={session.user.image} />;
  }
  if (status === 'loading') {
    return <h3>Loading...</h3>;
  }
  return (
    <Button
      variant='link'
      className='header-toggler rounded-0 shadow-none'
      type='button'
      onClick={() => signIn()}
    >
      Sign In
    </Button>
  );
}

type HeaderProps = {
  toggleSidebar: () => void;
  toggleSidebarMd: () => void;
};

export default function Header(props: HeaderProps) {
  const { toggleSidebar, toggleSidebarMd } = props;

  return (
    <header className='header sticky-top mb-4 p-2 border-bottom'>
      <Container fluid className='header-navbar d-flex align-items-center'>
        <Button
          variant='link'
          className='header-toggler d-md-none px-md-0 me-md-3 rounded-0 shadow-none'
          type='button'
          onClick={toggleSidebar}
        >
          <FontAwesomeIcon icon={faBars} />
        </Button>
        <Button
          variant='link'
          className='header-toggler d-none d-md-inline-block px-md-0 me-md-3 rounded-0 shadow-none'
          type='button'
          onClick={toggleSidebarMd}
        >
          <FontAwesomeIcon icon={faBars} />
        </Button>
        <Greeting />
        <div className='header-nav ms-auto'>
          <Profile />
        </div>
      </Container>
    </header>
  );
}
