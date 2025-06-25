import axios from 'axios';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { inngest } from "../inngest/index.js";

// API to get now playing shows from TMDB
export const getNowPlayingShows = async (req, res)=>{
  try{
    const {data} = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
      headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`},
    })

    const movies = data.results;
    res.json({success: true, movies: movies})

  } catch (error){
    console.log(error);
    res.json({success: false, message: error.message});
  }
}

// API to add a new show to the database
export const addShow = async (req, res)=>{
  try{
    const {movieId, showsInput, showPrice} = req.body

    let movie = await Movie.findById(movieId)

    if(!movie){
      // Fetch movie details and credits from TMDB 
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`,  {
          headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`}
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`}
        })
      ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast.map((c) => ({
          name: c.name,
          profile_path: c.profile_path
            ? `https://image.tmdb.org/t/p/w200${c.profile_path}`
            : null,
        })),
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || '',
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      }

      // Add movie to the database
      movie = await Movie.create(movieDetails);
    }

    // Create show documents
    const showsToCreate = showsInput.map(({ date, time }) => {
      const dateTimeString = `${date}T${time}`;
      return {
        movie: movieId,
        showDateTime: new Date(dateTimeString),
        showPrice,
        occupiedSeats: {},
      };
    });

    if(showsToCreate.length > 0){
      await Show.insertMany(showsToCreate);
    }

    // Trigger Inngest event
    await inngest.send({
      name: 'app/show.added',
      data: {movieTitle: movie.title}
    })

    res.json({success: true, message: 'Shows added successfully'});


  }
  catch(error) {
    console.log(error);
    res.json({success: false, message: error.message || 'Something went wrong'});
  }
}

// API to get all shows fom the database

export const getShows = async (req, res) => {
  try {
    const now = new Date();

    const shows = await Show.find({ showDateTime: { $gte: now } })
      .populate('movie')
      .sort({ showDateTime: 1 });

    // Deduplicate by movie._id
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



// API to get a single show from the database
export const getShow = async (req, res)=>{
  try{
    const {movieId} = req.params;

    // get all upcoming shows for a movie

    const shows = await Show.find({movie: movieId, showDateTime: {$gte: new Date()}})

    const movie = await Movie.findById(movieId)
    const dateTime = {};

    shows.forEach((show)=>{
      shows.forEach((show) => {
        const date = new Date(show.showDateTime).toISOString().split('T')[0];
        if (!dateTime[date]) {
          dateTime[date] = [];
        }
        dateTime[date].push({ time: show.showDateTime, showId: show._id });
      });
      
    })

    res.json({success: true, movie, dateTime});
  }
  catch (err){
    console.log(err);
    res.json({success: false, message: err.message});
  }
}