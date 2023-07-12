import { Commands } from '../types/types.js';
import RoomsDB from '../db/rooms.js';

export const updateRooms = () => {
  return JSON.stringify({
    type: Commands.UpdateRoom,
    data: JSON.stringify(RoomsDB.getAllRooms()),
  });
};
