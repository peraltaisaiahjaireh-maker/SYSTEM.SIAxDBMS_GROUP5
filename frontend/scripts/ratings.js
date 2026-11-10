// GJ-Chyll Morte

function rateSong(songId) {
  const score = $('ratingSelect').value;
  runAction(function () { return request('POST', '/ratings', { song_id: songId, score: score }); }, 'Rating saved', refreshPage);
}

function changeRating(ratingId, currentScore) {
  const options = [];
  for (let i = 5; i >= 1; i--) {
    options.push({ value: i, label: String(i) });
  }
  openForm('Change rating', [{ name: 'score', label: 'Rating (1 to 5)', type: 'select', options: options, value: currentScore }], async function (values) {
    await request('PUT', '/ratings/' + ratingId, { score: values.score });
    showMessage('Rating updated', false);
    await refreshPage();
  });
}

function deleteRating(ratingId) {
  if (!confirm('Remove this rating?')) {
    return;
  }
  runAction(function () { return request('DELETE', '/ratings/' + ratingId); }, 'Rating removed', refreshPage);
}

function submitComment(event, songId) {
  event.preventDefault();
  const text = event.target.elements.comment_text.value;
  runAction(function () { return request('POST', '/songs/' + songId + '/comments', { comment_text: text }); }, 'Comment added', refreshPage);
}

function editComment(commentId) {
  openForm('Edit comment', [{ name: 'comment_text', label: 'Comment', type: 'textarea', value: commentCache[commentId] }], async function (values) {
    await request('PUT', '/comments/' + commentId, { comment_text: values.comment_text });
    showMessage('Comment updated', false);
    await refreshPage();
  });
}

function deleteComment(commentId) {
  if (!confirm('Delete this comment?')) {
    return;
  }
  runAction(function () { return request('DELETE', '/comments/' + commentId); }, 'Comment deleted', refreshPage);
}

// ISAIAH JAIREH S. PERALTA
let artistCache = {};

async function loadRatings() {
  const ratings = await request('GET', '/ratings');
  let rows = [];
  for (let i = 0; i < ratings.length; i++) {
    const r = ratings[i];
    rows.push([
      songLink(r.song_id, r.song_title),
      esc(r.artist_name),
      r.score + ' / 5',
      makeSeeMoreMenu([
        { label: 'Change rating', action: 'changeRating(' + r.rating_id + ', ' + r.score + ')' },
        { label: 'Remove rating', action: 'deleteRating(' + r.rating_id + ')', extraClass: 'danger' }
      ])
    ]);
  }
  return '<h2>My ratings</h2>' + makeTable(['Song', 'Artist', 'Rating', ''], rows, 'You have not rated any songs yet. Open a song to rate it.');
}