import { API_ENDPOINT } from "@/constants/apiEndpoint";
import { baseApi } from "@/redux/store/baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (body) => ({
        url: API_ENDPOINT.AUTH.REGISTER,
        method: "POST",
        data: body,
      })
    }),
    loginUser: builder.mutation({
      query: (body) => ({
        url: API_ENDPOINT.AUTH.LOGIN,
        method: "POST",
        data: body
      })
    })
  }),
});

export const { useRegisterUserMutation, useLoginUserMutation } = authApi;