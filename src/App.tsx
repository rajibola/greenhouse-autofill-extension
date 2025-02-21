import React, { useState, useEffect } from "react";
import { Upload } from "lucide-react";

interface Candidate {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  education: {
    school: string;
    degree: string;
    field: string;
    endDate: string;
  }[];
  experience: {
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  resumePath: string;
}

const defaultCandidate: Candidate = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  phone: "(555) 123-4567",
  education: [
    {
      school: "University of Technology",
      degree: "Bachelor of Science",
      field: "Computer Science",
      endDate: "2020-05",
    },
  ],
  experience: [
    {
      company: "Tech Solutions Inc.",
      title: "Software Developer",
      startDate: "2020-06",
      endDate: "2023-01",
      description: "Developed web applications using JavaScript and React.",
    },
  ],
  resumePath: "",
};

function App() {
  const [candidate, setCandidate] = useState<Candidate>(defaultCandidate);
  const [status, setStatus] = useState<string>("");
  const [isExtension, setIsExtension] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    // Check if we're running in the Chrome extension context
    setIsExtension(
      typeof chrome !== "undefined" && chrome.storage !== undefined
    );

    // Only try to access chrome.storage if we're in the extension context
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["candidateData"], (result) => {
        if (result.candidateData) {
          setCandidate(result.candidateData);
        }
      });
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const fileContent = reader.result as string;
        const updatedCandidate = {
          ...candidate,
          resumePath: fileContent,
        };
        setCandidate(updatedCandidate);

        if (isExtension) {
          chrome.storage.local.set({ candidateData: updatedCandidate });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutofill = async () => {
    if (!isExtension) {
      setStatus("This feature is only available in the Chrome extension.");
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: "AUTOFILL",
          candidate,
        });
        setStatus("Form autofilled successfully!");
      }
    } catch {
      setStatus(
        "Error: Could not autofill form. Make sure you are on a Greenhouse application page."
      );
    }
  };

  return (
    <div className="w-96 p-4 bg-white">
      <h1 className="text-2xl font-bold mb-4">Greenhouse Autofiller</h1>

      {!isExtension && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">
          Note: You are viewing this in development mode. Some features will
          only work in the Chrome extension.
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Resume</label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            <Upload size={16} />
            Upload Resume
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <span className="text-sm text-gray-600">
            {fileName || "No file selected"}
          </span>
        </div>
      </div>

      <button
        onClick={handleAutofill}
        className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Autofill Application
      </button>

      {status && (
        <p
          className={`mt-4 p-2 rounded ${
            status.includes("Error")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}

export default App;
