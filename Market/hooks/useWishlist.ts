import { View, Text, Alert } from 'react-native'
import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Product } from '../types'


const useWishList = () => {
 const queryClient = useQueryClient()

 const {data:wishList, isLoading, isError, refetch}= useQuery({
 queryKey:['wishlist'],
 queryFn: async()=>{
  const {data} = await api.get<{wishList:Product[]}>("/users/wishList")
   return data.wishList
 }
 })
 
 const addToWishListMutation = useMutation({
     mutationFn: async (productId:string)=>{
       const {data} = await api.post<{wishList:string[]}>("/users/wishList",{productId})
       return data.wishList
     },

     onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:['wishlist']})
     },
 })


 const removefromWishListMutation = useMutation({
     mutationFn: async (productId:string)=>{
       const {data} = await api.delete<{wishList:string[]}>(`/users/wishList/${productId}`)
       return data.wishList
     },

     onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:['wishlist']})
     },
 })

const isInWishList = (productId:string)=>{
  return wishList?.some((product)=>product._id ===productId)?? false
}

const togglleWishList =(productId:string)=>{
   if(isInWishList(productId)){
    removefromWishListMutation.mutate(productId)
   }else{
    addToWishListMutation.mutate(productId)
   }
}

  return {
    wishList:wishList || [],
    isError,
    isLoading,
    togglleWishList,
    refetch,
    addToWishListMutation:addToWishListMutation.mutate,
    removefromWishListMutation:removefromWishListMutation.mutate,
    isInWishList,
    wishListCount:wishList?.length || 0,
    isAddingToWishList:addToWishListMutation.isPending?addToWishListMutation.variables:null,
    isRemovingFromWishList:removefromWishListMutation.isPending?removefromWishListMutation.variables:null
  }
  
  
}

export default useWishList