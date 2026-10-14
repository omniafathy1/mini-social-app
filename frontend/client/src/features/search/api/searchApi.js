import { axiosClient } from '../../../api/axiosClient';

export const searchApi = async (query) => {
  const { data } = await axiosClient.get('/search', { params: { q: query } });
  return data;
};