import Booking from '../models/Booking.js';
import { clerkClient } from '@clerk/express';
import Movie from '../models/Movie.js';
// API controller function to get user bookings

export const getUserBookings = async (req, res) => {
  try {
    const user = req.auth().userId;

    const bookings = await Booking.find({user}).populate({
      path: 'show',
      populate: {path: "movie"}
    }).sort({createdAt: -1});

    // Return the bookings in the response
    res.json({
      success: true, bookings,
    })
  } catch (error) {
    console.error(error.message);
    res.json({
      success: false,
      message: 'Server error while fetching bookings',
    });
  }
}

// API Controller Function to Update Favorite Movie in clerk user metadata
export const updateFavorite = async (req, res) => {
  try {
    const userId = req.auth().userId;
    const { movieId } = req.body;

    const user = await clerkClient.users.getUser(userId)

    if(!user.privateMetadata.favorites){
      user.privateMetadata.favorites = [];
    }

    if(!user.privateMetadata.favorites.includes(movieId)){
      user.privateMetadata.favorites.push(movieId);
    }
    else{
      user.privateMetadata.favorites = user.privateMetadata.favorites.filter(item => item !== movieId);
    }

    await clerkClient.users.updateUserMetadata(userId, {privateMetadata: user.privateMetadata});
    res.json({success: true, message: 'Favorite movie updated successfully'});
    
  } catch (error) {
    console.error(error.message);
    res.json({
      success: false,
      message: 'Server error while adding favorite movie',
    });
  }
}

export const getFavorites = async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.auth().userId);
    const favorites = user.privateMetadata.favorites;

    // Getting movies from database
    const movies = await Movie.find({_id: {$in: favorites}})

    res.json({ success: true, movies });
  } catch (error) {
    console.error(error.message);
    res.json({
      success: false,
      message: 'Server error while fetching favorite movies',
    });
  }
}