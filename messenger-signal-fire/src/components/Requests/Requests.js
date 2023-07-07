import StrangersCardList from '../StrangersCardList/StrangersCardList';
import React, { useContext, useEffect, useState } from 'react';
import './Requests.css';
import { CurrentUserContext } from '../../utils/contexts';
import MainApi from '../../utils/api/MainApi';

export default function Requests(props) {
  const { currentUser } = useContext(CurrentUserContext);
  const [reqs, setReqs] = useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmit, setIsSubmit] = React.useState(false);
  const [error, setError] = React.useState({
    isError: false,
    status: '',
    message: '',
  });
  const [input, setInput] = React.useState('');

  useEffect(() => {
    Promise.all(
      currentUser.followers
        .filter((follower) => !currentUser.followings.includes(follower))
        .map((follower) => MainApi.getUser(follower))
    )
      .then((followers) => {
        const users = followers.map((fwr) => {
          const { data: user } = fwr;
          return user;
        });
        console.log(users);
        setReqs([...users]);
      })
      .catch((err) => console.log(err));
  }, [currentUser.followers, currentUser.followings]);

  return (
    <main className='movies'>
      <StrangersCardList
        onError={setError}
        onSubmit={{ isSubmit, setIsSubmit }}
        input={input}
        saved={false}
        type={'requests'}
        reqs={reqs}
      />
    </main>
  );
}
