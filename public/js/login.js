/* eslint-disable */

const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateTheUser = document.querySelector('.form-user-data');
const updateTheUserPassword = document.querySelector('.form-user-settings');

const login = async (email, password) => {
  console.log(email);
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
      withCredentials: true,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged In Successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500); //takes to home page after 1.5 seconds
    }

    //console.log(res);
  } catch (err) {
    showAlert('error', 'Invalid credentials');
  }
};

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (res.data.status === 'success') location.reload(true); //this will force reload from the server
    console.log(res);
  } catch (err) {
    console.log('error', 'Error logging out');
  }
};

//type us either password or (email,user)
const updateUserData = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/UpdateMyPassword'
        : '/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data,
    });
    if (res.data.status === 'success') {
      showAlert('success', ` ${type.toUpperCase()} Updated Successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};

const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
//selecting a logout button from the header template

if (updateTheUser) {
  updateTheUser.addEventListener('submit', (e) => {
    e.preventDefault();
    // const email = document.getElementById('email').value;
    // const name = document.getElementById('name').value;
    //updateUserData({ name, email }, 'data');

    //if you want to add file(photo) as well then use this process

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]); //files are stored in array
    updateUserData(form, 'data');
  });
}

if (updateTheUserPassword) {
  updateTheUserPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateUserData(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    //so that after pw changed the current password will be empty
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

//connecting stripe from backedn to frontend

const stripe = Stripe(
  'pk_test_51JHQP7BgCFEypCIhCApbmRxluRLgeLDsV0On4cBFryq2EyJBW7V4xYAvUfGeHgAFlC0ApUxLj6rdY0UpQ0QH2vCT00O16BiIQB'
);

const bookTour = async (tourid) => {
  try {
    // 1) gET CHECKOUT session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourid}`);
    console.log(session);
    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    }); //this is the session which we obtain from stripe
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

const bookBtn = document.getElementById('book-tour');

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing..';
    const tourId = e.target.dataset.tourid; //e.target means the button..which contains the tourid in tour.pug(last line)
    //console.log(e.target.dataset.tourid);
    bookTour(tourId);
  });
