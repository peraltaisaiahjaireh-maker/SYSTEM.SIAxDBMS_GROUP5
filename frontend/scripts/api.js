async function request(method, url, body) {
  loadingCount++;
  $('loading').classList.remove('hidden');
  try {
    const options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch('/api' + url, options);
    let result;
    try {
      result = await response.json();
    } catch (e) {
      throw new Error('The server sent an unreadable answer');
    }
    if (!response.ok) {
      if (response.status === 401 && token) {
        forceLogout('Your session ended. Please log in again.');
      }
      throw new Error(result.message || 'Request failed');
    }
    return result.data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Cannot reach the server. Is it running?');
    }
    throw err;
  } finally {
    loadingCount--;
    if (loadingCount === 0) {
      $('loading').classList.add('hidden');
    }
  }
}

// where runAction
async function runAction(work, successText, after) {
  try {
    await work();
    if (successText) {
      showMessage(successText, false);
    }
    if (after) {
      await after();
    }
  } catch (err) {
    showMessage(err.message, true);
  }
}

// LOGIN AND REGISTER or login screen
