import React from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Movies from "./pages/Movies.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import SeatLayout from "./pages/SeatLayout.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Favorite from "./pages/Favorite.jsx";
import { Toaster } from "react-hot-toast";
import Layout from "./pages/admin/Layout.jsx";
import AddShows from "./pages/admin/AddShows.jsx";
import ListShows from "./pages/admin/ListShows.jsx";
import ListBookings from "./pages/admin/ListBookings.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import { useAppContext } from "./context/AppContext.jsx";
import { SignIn } from "@clerk/clerk-react";

const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith("/admin");
  const {user} = useAppContext();
  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/movies/:id/:date" element={<SeatLayout />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/favorite" element={<Favorite />} />
        <Route path="/admin/*" element={ user ? <Layout /> : (
          <div className="min-h-screen flex items-center justify-center">
            <SignIn fallbackRedirectUrl={'/admin'} />
          </div>
        )}> 
         <Route index element={<Dashboard/>}/>
         <Route path="add-shows" element={<AddShows/>}/>
         <Route path="list-shows" element={<ListShows/>}/>
         <Route path="list-bookings" element={<ListBookings/>}/>
        </Route>
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;
