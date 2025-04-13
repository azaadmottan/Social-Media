import { API_ENDPOINT } from "@/constants/apiEndpoint";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: API_ENDPOINT.BASE_URL,
  withCredentials: true,
});

export { axiosInstance };