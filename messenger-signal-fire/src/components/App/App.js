import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Main from '../Main/Main';
import Strangers from '../Strangers/Strangers';
import Profile from '../Profile/Profile';
import Register from '../Register/Register';
import Login from '../Login/Login';
import Messenger from '../Messenger/Messenger';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import NotFoundPage from '../NotFoundPage/NotFoundPage';
import { useEffect, useState } from 'react';
import {
  StrangersContext,
  SavedMoviesContext,
  CurrentUserContext,
  DialogContext,
} from '../../utils/contexts';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';
import MainApi from '../../utils/api/MainApi';
import Friends from '../Friends/Friends';
import Requests from '../Requests/Requests';

function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState({
    isLogged: false,
    isLogging: true,
    _id: '',
    name: '',
    email: '',
    image: '',
    followers: [],
    followings: [],
  });
  const location = useLocation();
  const [strangers, setStrangers] = useState([]);
  const [savedMovies, setSavedMovies] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isFound, setIsFound] = useState(true);
  const onOpen = () => setIsFound(false);
  const onClose = () => setIsFound(true);

  useEffect(() => {
    MainApi.initEncryptionViaStorage()
      .then(() => MainApi.getFriends())
      .then(({ data }) => {
        setSavedMovies(data);
        console.log(data);
        return MainApi.getProfile();
      })
      .then(({ data }) => {
        const { email, name, _id, followers, followings, image } = data;
        setCurrentUser((curUser) => ({
          ...curUser,
          isLogged: true,
          _id,
          name,
          email,
          image,
          followers,
          followings,
          isLogging: false,
        }));
      })
      .catch((err) => {
        console.log(err);
        setCurrentUser((curUser) => ({
          ...curUser,
          isLogged: false,
          name: '',
          email: '',
          image: '',
          followers: [],
          followings: [],
          isLogging: false,
        }));
      });
  }, [setSavedMovies]);

  return (
    <div
      className={`App ${
        location.pathname === '/' ||
        location.pathname === '/strangers' ||
        location.pathname === '/friends' ||
        location.pathname === '/profile'
          ? 'App_color_light'
          : ''
      }`}
    >
      <div className='page'>
        <CurrentUserContext.Provider value={{ currentUser, setCurrentUser }}>
          <SavedMoviesContext.Provider value={{ savedMovies, setSavedMovies }}>
            <StrangersContext.Provider value={{ strangers, setStrangers }}>
              <DialogContext.Provider
                value={{ conversations, setConversations }}
              >
                {isFound &&
                  location.pathname !== '/signup' &&
                  location.pathname !== '/signin' && <Header />}
                <Routes>
                  <Route exact path='/' element={<Main />} />
                  <Route
                    exact
                    path='/strangers'
                    element={<ProtectedRoute element={Strangers} />}
                  />
                  <Route
                    exact
                    path='/friends'
                    element={<ProtectedRoute element={Friends} />}
                  />
                  <Route
                    exact
                    path='/requests'
                    element={<ProtectedRoute element={Requests} />}
                  />
                  <Route
                    exact
                    path='/campfire'
                    element={<ProtectedRoute element={Messenger} />}
                  />
                  <Route
                    exact
                    path='/profile'
                    element={<ProtectedRoute element={Profile} />}
                  />
                  <Route exact path='/signup' element={<Register />} />
                  <Route exact path='/signin' element={<Login />} />
                  <Route
                    path='*'
                    element={<NotFoundPage onOpen={onOpen} onClose={onClose} />}
                  />
                </Routes>
                {isFound &&
                  location.pathname !== '/signup' &&
                  location.pathname !== '/signin' &&
                  location.pathname !== '/profile' && <Footer />}
              </DialogContext.Provider>
            </StrangersContext.Provider>
          </SavedMoviesContext.Provider>
        </CurrentUserContext.Provider>
      </div>
    </div>
  );
}

export default App;
