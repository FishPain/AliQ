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
import { ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";

const EcommercePage = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      image: [],
    },
  });
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("https://api.escuelajs.co/api/v1/products");
        const data = await response.json();

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

  const handleUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await uploadResponse.json();
      if (uploadResponse.ok) {
        console.log('File path:', result.filePath);
        return result.filePath;
      } else {
        alert(`Failed to upload file: ${result.error}`);
        return null;
      }
    } catch (error) {
      alert('An error occurred while uploading the file.');
      console.error('Error:', error);
      return null;
    }
  };

  const handleSearch = async (values: z.infer<typeof formSchema>) => {
    const query = values.prompt.trim();
    const imageFile = values.image[0]; // Assuming 'image' is a file input field
    const messages = [];

    // Add text prompt to messages
    if (query) {
      messages.push({
        type: "text",
        text: query,
      });
    }

    // Handle image file if present
    if (imageFile) {
      const filePath = await handleUpload(imageFile);
      if (filePath) {
        messages.push({
          type: "image_url",
          url: filePath,
        });
      }
    }

    const payload = {
      role: "user",
      content: messages,
    };

    try {
      setIsLoading(true);
      console.log("Payload:", payload);
      const response = await fetch("/api/products/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [payload] }),
      });

      const result = await response.json();

      if (response.ok) {
        const recommendations = result;

        const filteredProducts = products
          .map((product: { id: { toString: () => any } }) => {
            const recommendation = recommendations.find(
              (rec: { product_id: any }) => rec.product_id === product.id.toString()
            );
            if (recommendation) {
              return { ...product, reason: recommendation.reason };
            }
            return null;
          })
          .filter((product: { reason: any; id: { toString: () => any } } | null) => product !== null);

        setProducts(filteredProducts);
      }
    } catch (error) {
      console.error("Failed to search products", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        title="Ali-Query"
        description="Shop comfortably with ease"
        icon={ShoppingCart}
        iconColor="text-red-700"
        bgColor="bg-red-700/10"
      />
      <div className="px-4 lg:px-8 flex justify-center gap-4 items-center">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSearch)}
            className="rounded-lg border w-full p-4 mb-4 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2 relative"
          >
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-11">
                  <FormControl className="m-0 p-0">
                    <Input
                      className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                      disabled={isLoading}
                      placeholder="eg. It's my gf bday, plz reco some 礼物. No need too atas."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-12">
              <div className="col-span-12 lg:col-span-2">
                <div
                  className="absolute top-6 right-50 flex items-center cursor-pointer"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <svg
                    className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24" height="24" viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2" >
                    <path d="M12 2c-1.7 0-3 1.2-3 2.6v6.8c0 1.4 1.3 2.6 3 2.6s3-1.2 3-2.6V4.6C15 3.2 13.7 2 12 2z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18.4v3.3M8 22h8" />
                  </svg>
                </div>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  className="hidden"
                  disabled={isLoading}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      field.onChange(Array.from(files));  // Update the form's state
                    }
                  }}
                />
              </div>
              <FormField
                name="image"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-2">
                    <FormControl className="w-full">
                      <div className="">
                        <div
                          className="absolute top-6 right-30 flex items-center cursor-pointer"
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <svg
                            className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                          </svg>
                        </div>
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          className="hidden"
                          disabled={isLoading}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                              field.onChange(Array.from(files));  // Update the form's state
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="col-span-12 lg:col-span-8 flex justify-center">
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  Search
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
      {
        isLoading ? (
          <p className="text-center text-gray-600">Loading products...</p>
        ) : products.length > 0 ? (
          <div className="px-4 lg:px-8 flex justify-center gap-4 items-center grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product: any) => renderProduct(product))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No products found.</p>
        )
      }
    </div >
  );
};

export default EcommercePage;
