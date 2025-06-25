import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
  {
    movie: { type: String,ref: 'Movie', required: true }, // Store movieId as string
    showDateTime: { type: Date, required: true }, // Store as Date, not Number
    showPrice: { type: Number, required: true },
    occupiedSeats: { type: Object, default: {} },
  },
  { minimize: false }
);

const Show = mongoose.model("Show", showSchema);
export default Show;
