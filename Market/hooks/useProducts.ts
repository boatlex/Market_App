
import { api } from '../lib/api'
import { useQuery } from '@tanstack/react-query'
import { Product } from '../types'
import { useAuth } from '@clerk/expo' 

const useProducts = () => {
  const { isLoaded, isSignedIn } = useAuth() 

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await api.get<{products: Product[]}>("/products")
      return data?.products
    },
   
    enabled: isLoaded && isSignedIn, 
  })

  return {
    results,
    isLoading: !isLoaded || !isSignedIn || isLoading,
    isError,
  }
}

export default useProducts


