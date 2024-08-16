declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition | typeof webkitSpeechRecognition;
        webkitSpeechRecognition: typeof webkitSpeechRecognition;
    }

    var SpeechRecognition: {
        prototype: SpeechRecognition;
        new(): SpeechRecognition;
    };

    var webkitSpeechRecognition: {
        prototype: SpeechRecognition;
        new(): SpeechRecognition;
    };

    interface SpeechRecognition {
        start(): void;
        stop(): void;
        onresult: (event: SpeechRecognitionEvent) => void;
        continuous: boolean;
        interimResults: boolean;
        lang: string;
    }

    interface SpeechRecognitionEvent {
        readonly resultIndex: number;
        readonly results: SpeechRecognitionResultList;
    }

    interface SpeechRecognitionResultList {
        readonly length: number;
        item(index: number): SpeechRecognitionResult;
        [index: number]: SpeechRecognitionResult;
    }

    interface SpeechRecognitionResult {
        readonly length: number;
        item(index: number): SpeechRecognitionAlternative;
        readonly isFinal: boolean;
        [index: number]: SpeechRecognitionAlternative;
    }

    interface SpeechRecognitionAlternative {
        readonly transcript: string;
        readonly confidence: number;
    }
}

export { };
