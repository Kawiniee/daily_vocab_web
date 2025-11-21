"use client";

import { useState, useEffect, useCallback } from "react";
import { Word, Difficulty } from "@/types";

export default function Home() {
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [sentence, setSentence] = useState<string>("");
    const [result, setResult] = useState<any>(null);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    // โหลดคำใหม่จาก backend
    const getRandomWord = useCallback(async () => {
        const response = await fetch("/api/word");
        const result = await response.json();

        setCurrentWord(result.data);
        setSentence("");
        setResult(null);
        setIsSubmitted(false);
    }, []);

    useEffect(() => {
        getRandomWord();
    }, [getRandomWord]);

    const handleSentenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSentence(e.target.value);
        if (isSubmitted) {
            setResult(null);
            setIsSubmitted(false);
        }
    };

    // ส่งประโยคไปให้ backend ตรวจ
    const handleSubmitSentence = async () => {
        if (!currentWord) return;

        const response = await fetch("http://localhost:8000/api/validate-sentence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: 1,
                word_id: currentWord.id,
                sentence: sentence
            })
        });

        if (!response.ok) {
            alert("Error validating sentence");
            return;
        }

        const data = await response.json();
        setResult(data);
        setIsSubmitted(true);

        // save history
        const history = JSON.parse(localStorage.getItem("wordHistory") || "[]");
        history.push({
            word: currentWord.word,
            sentence: sentence,
            score: data.score,
            suggestion: data.suggestion,
            corrected_sentence: data.corrected_sentence,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem("wordHistory", JSON.stringify(history));
    };

    const handleNextWord = () => {
        getRandomWord();
    };

    const getDifficultyColor = (difficulty: Difficulty) => {
        switch (difficulty) {
            case "Beginner":
                return "bg-green-200 text-green-800";
            case "Intermediate":
                return "bg-yellow-200 text-yellow-800";
            case "Advanced":
                return "bg-red-200 text-red-800";
            default:
                return "bg-gray-200 text-gray-800";
        }
    };

    if (!currentWord) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 text-gray-800">
                Word Challenge
            </h1>

            <div className="bg-white p-8 rounded-2xl shadow-xl mb-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary">
                        {currentWord.word}
                    </h2>
                    <span
                        className={`px-4 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(
                            currentWord.difficulty
                        )}`}
                    >
                        {currentWord.difficulty}
                    </span>
                </div>

                <p className="text-lg md:text-xl text-gray-700 mb-6">{currentWord.meaning}</p>

                <textarea
                    className="w-full p-4 border border-gray-300 rounded-lg text-lg resize-y"
                    rows={4}
                    placeholder="Type your sentence..."
                    value={sentence}
                    onChange={handleSentenceChange}
                    disabled={isSubmitted}
                ></textarea>

                <div className="flex justify-between items-center mt-6">
                    {!isSubmitted ? (
                        <button
                            onClick={handleSubmitSentence}
                            className="px-6 py-3 bg-primary text-white rounded-lg font-medium"
                            disabled={!sentence.trim()}
                        >
                            Submit Sentence
                        </button>
                    ) : (
                        <button
                            onClick={handleNextWord}
                            className="px-6 py-3 bg-info text-white rounded-lg font-medium"
                        >
                            Next Word
                        </button>
                    )}
                </div>

                {/* Result Box */}
                {result && (
                    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                        <p className="text-xl font-bold">
                            Score: <span className="text-blue-600">{result.score}</span>
                        </p>

                        <p className="mt-2">
                            <strong>Level:</strong> {result.level}
                        </p>

                        <p className="mt-2">
                            <strong>Suggestion:</strong> {result.suggestion}
                        </p>

                        <p className="mt-2">
                            <strong>Corrected sentence:</strong>{" "}
                            <span className="text-green-600">{result.corrected_sentence}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
