import tmdb from '../utils/tmdb.js';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { inngest } from '../inngest/index.js';

// GET now playing movies from TMDB
export const getNowPlayingShows = async (req, res) => {
  try {
    const { data } = await tmdb.get('/movie/now_playing');
    const movies = data.results;
    res.json({ success: true, movies });
  } catch (error) {
    console.error('TMDB now playing error:', error.message || error.code);
    res.json({ success: false, message: 'Failed to fetch now playing movies' });
  }
};

// ADD new show to DB
export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice } = req.body;

    let movie = await Movie.findById(movieId);
    if (!movie) {
      const [detailsRes, creditsRes] = await Promise.all([
        tmdb.get(`/movie/${movieId}`),
        tmdb.get(`/movie/${movieId}/credits`)
      ]);

      const movieApiData = detailsRes.data;
      const movieCreditsData = creditsRes.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast.map(c => ({
          name: c.name,
          profile_path: c.profile_path
            ? `https://image.tmdb.org/t/p/w200${c.profile_path}`
            : null
        })),
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || '',
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      movie = await Movie.create(movieDetails);
    }

    const showsToCreate = showsInput.map(({ date, time }) => ({
      movie: movieId,
      showDateTime: new Date(`${date}T${time}`),
      showPrice,
      occupiedSeats: {},
    }));

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    await inngest.send({
      name: 'app/show.added',
      data: { movieTitle: movie.title, movieId: movie._id.toString() }
    });    

    res.json({ success: true, message: 'Shows added successfully' });
  } catch (error) {
    console.error('Add show error:', error.message || error.code);
    res.json({ success: false, message: error.message || 'Error adding show' });
  }
};

// GET all upcoming shows
export const getShows = async (req, res) => {
  try {
    const now = new Date();
    const shows = await Show.find({ showDateTime: { $gte: now } })
      .populate('movie')
      .sort({ showDateTime: 1 });

    const uniqueShowsMap = new Map();
    for (const show of shows) {
      const movieId = show.movie?._id?.toString();
      if (movieId && !uniqueShowsMap.has(movieId)) {
        uniqueShowsMap.set(movieId, show);
      }
    }

    res.json({ success: true, shows: Array.from(uniqueShowsMap.values()) });
  } catch (err) {
    console.log('Error in getShows:', err);
    res.json({ success: false, message: err.message });
  }
};

// GET show details for a specific movie
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;

    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    });

    const movie = await Movie.findById(movieId);

    const dateTime = {};
    shows.forEach(show => {
      const date = new Date(show.showDateTime).toISOString().split('T')[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }
      dateTime[date].push({ time: show.showDateTime, showId: show._id });
    });

    res.json({ success: true, movie, dateTime });
  } catch (err) {
    console.log('getShow error:', err);
    res.json({ success: false, message: err.message });
  }
};
