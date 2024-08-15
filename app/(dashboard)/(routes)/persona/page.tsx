"use client";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "./constants";

import * as z from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

const EcommercePage = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all product data initially
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("https://api.escuelajs.co/api/v1/products");
        const data = await response.json();

        // Ensure that the URLs are properly formatted and absolute
        const cleanedData = data.map((product: any) => ({
          ...product,
          images: product.images.map((image: string) => {
            if (image.startsWith('["') && image.endsWith('"]')) {
              return JSON.parse(image)[0];
            }
            return image;
          }),
        }));

        setProducts(cleanedData);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getSearchPrompt = (query: string) => { 
    return `${query}`;
  }

  const handleSearch = async (values: z.infer<typeof formSchema>) => {
    const query = values.prompt.trim();
    
    if (query === "") {
      // If the search query is empty, fetch all products again
      const response = await fetch("https://api.escuelajs.co/api/v1/products");
      const data = await response.json();
      setProducts(data);
    } else {
      try {
        setIsLoading(true);
        
        // Fetch all products again to reset the filter
        const response = await fetch("https://api.escuelajs.co/api/v1/products");
        const allProducts = await response.json();
        setProducts(allProducts);
  
        const searchResponse = await fetch("/api/products/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: [{ role: "user", content: getSearchPrompt(query) }] }),
        });
        const result = await searchResponse.json();
        if (searchResponse.ok) {
          console.log("Search results:", result); 
          const recommendations = result;
  
          // Extract product IDs and include reasons in filteredProducts
          const filteredProducts = allProducts
            .map((product: { id: { toString: () => any; }; }) => {
              const recommendation = recommendations.find((rec: { product_id: any; }) => rec.product_id === product.id.toString());
              if (recommendation) {
                return { ...product, reason: recommendation.reason };
              }
              return null;
            })
            .filter((product: null) => product !== null);
          
          setProducts(filteredProducts);
        }
      } catch (error) {
        console.error("Failed to search products", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  
  // Render product information
  const renderProduct = (product: any) => {
    return (
      <div key={product.id} className="bg-white shadow-lg rounded-lg p-6">
        <img
          src={product.images[0]}
          alt={product.title}
          className=""
        />
        <div className="pt-4">
          <h3 className="text-lg font-semibold">{product.title}</h3>
          <p className="text-sm text-gray-600">{product.description}</p>
          {product.reason && (
            <p className="text-sm text-blue-600 mt-2">Reason: {product.reason}</p>
          )}
          <p className="text-red-500 font-bold">${product.price}</p>
          <Button
            className="w-full mt-4 bg-red-700 text-white"
            onClick={() => router.push(`/product/${product.id}`)}
          >
            View Product
          </Button>
        </div>
      </div>
    );
  };
  

  return (
    <div>
      <Heading
        title="Our Products"
        description="Explore our exclusive collection."
        icon={ImageIcon}
        iconColor="text-red-700"
        bgColor="bg-red-700/10"
      />
      <div className="px-4 lg:px-8 flex gap-4 items-center">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSearch)}
            className="rounded-lg border w-full p-4 mb-4 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2 relative"
          >
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10">
                  <FormControl className="m-0 p-0">
                    <Input
                      className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                      disabled={isLoading}
                      placeholder="E.g. How do I promote my shirt for my brand? I am a small startup that sells aesthetic wear for sports."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"  // Make sure this button submits the form
              disabled={isLoading}
              className="w-full p-2 col-span-12 lg:col-span-2"
            >
              Generate
            </Button>
          </form>
        </Form>
      </div>
      {isLoading ? (
        <p className="text-center text-gray-600">Loading products...</p>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: any) => renderProduct(product))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No products found.</p>
      )}
    </div>
  );
};

export default EcommercePage;
