import { api } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

interface UserPopulated {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
}

interface CommentPopulated {
    _id: string;
    text: string;
    user: UserPopulated;
    createdAt: string;
}

interface Product {
    _id: string;
    seller: UserPopulated;
    name: string;
    description: string;
    price: number;
    phoneNumber: string;
    productType: string;
    region: string;
    location: string;
    category: string;
    images: string[];
    comments: CommentPopulated[];
    createdAt: string;
}

interface UserProductsResponse {
    success: boolean;
    products: Product[];
}

export const useUserProducts = () => {
    return useQuery<UserProductsResponse>({
        queryKey: ["products", "my-listings"],
        queryFn: async () => {
            const response = await api.get("/products/user"); 
            return response.data;
        },
        retry: 1,
    });
};
