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
import { ShoppingCart, Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import Modal from "@/components/modal"; // Import the Modal component

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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);  // State for image preview

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            form.setValue("prompt", form.getValues("prompt") + " " + event.results[i][0].transcript);
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim);
      };

      setRecognition(recognitionInstance);
    } else {
      alert("Speech recognition not supported in this browser.");
    }

    fetchProducts();
  }, []);

  const fetchProducts = async (isLoading: boolean = false) => {
    try {
      const response = await fetch("/api/products/all");
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
      setIsLoading(isLoading);
    }
  };

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setImagePreview(URL.createObjectURL(file));  // Set preview image
      form.setValue("image", [file]);  // Update the form's state with the selected image
    }
  };

  const handleSearch = async (values: z.infer<typeof formSchema>) => {
    const query = values.prompt.trim();
    const imageFile = values.image[0];
    const messages = [];

    if (query) {
      messages.push({
        type: "text",
        text: query,
      });
    }

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

      // Fetch the full list of products before filtering
      const response = await fetch("/api/products/all");
      const allProducts = await response.json();

      const searchResponse = await fetch("/api/products/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [payload] }),
      });

      const result = await searchResponse.json();

      if (searchResponse.ok) {
        console.log("Recommendations:", result);
        const filteredProducts = allProducts
          .map((product: { id: { toString: () => any } }) => {
            const recommendation = result.find(
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
      setImagePreview(null);  // Reset the image preview
      form.reset();
    }
  };



  const handleAudioClick = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
    } else {
      setInterimTranscript("");
      recognition?.start();
      setIsRecording(true);
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
            className="flex flex-row relative rounded-lg border w-full p-4 focus-within:shadow-sm gap-2 mb-4"
          >
            {/* text input */}
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="flex w-full justify-center items-center">
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
            {/* audio input */}
            <div className="flex justify-center items-center">
              <div
                className="cursor-pointer"
                onClick={handleAudioClick}  // Trigger the modal
              >
                <svg
                  className="w-6 h-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2c-1.7 0-3 1.2-3 2.6v6.8c0 1.4 1.3 2.6 3 2.6s3-1.2 3-2.6V4.6C15 3.2 13.7 2 12 2z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18.4v3.3M8 22h8" />
                </svg>
              </div>
            </div>
            {/* image input */}
            {imagePreview ? (
              <div className="flex justify-center">
                <img
                  src={imagePreview}
                  alt="Image preview"
                  className="rounded-lg shadow-lg object-contain h-24 w-24"
                />
              </div>
            ) : (
              <FormField
                name="image"
                render={({ field }) => (
                  <FormItem className="flex justify-center items-center">
                    <FormControl className="w-full">
                      <div>
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <svg
                            className="w-6 h-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
                          onChange={handleImageChange}  // Handle image change
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <div className="flex justify-center items-center">
              <Button
                type="submit"
                disabled={isLoading}
              >
                Search
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Modal for Audio Input */}
      <Modal isVisible={isModalVisible} onClose={closeModal}>
        <h2 className="text-lg font-semibold text-center">Audio Input</h2>
        <div className="flex justify-center items-center mt-4">
          <Button
            onClick={toggleRecording}
            className={`w-16 h-16 ${isRecording ? "bg-red-600" : "bg-green-600"} text-white rounded-full flex justify-center items-center`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-4 text-center">
          {isRecording ? "Recording... Click to stop." : "Click to start recording."}
        </p>
        <p className="mt-4 text-center text-gray-700">{interimTranscript}</p> {/* Display the interim transcript */}
      </Modal>
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
    </div>
  );
};

export default EcommercePage;
