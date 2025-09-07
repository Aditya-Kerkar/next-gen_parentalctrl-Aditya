from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
import nltk
from nltk.stem.porter import PorterStemmer
from nltk.corpus import stopwords
import re, string
import pickle
import os

app = Flask(__name__)

# Download required NLTK data
nltk.download('all')
nltk.download('stopwords')
nltk.download('punkt')

# Initialize global variables
porter_stemmer = PorterStemmer()
stop = stopwords.words('english')
regex = re.compile('[%s]' % re.escape(string.punctuation))

# File paths for saved models
MODEL_PATH = 'cyberbullying_model.pkl'
VECTORIZER_PATH = 'tfidf_vectorizer.pkl'

def train_and_save_model():
    print("Training new model...")
    
    # Load training data
    df = pd.read_json('Dataset for Detection of Cyber-Trolls.json', lines=True, orient='columns')
    
    # Process labels
    for i in range(0, len(df)):
        if df.annotation[i]['label'][0] == '1':
            df.loc[i, 'annotation'] = 1
        else:
            df.loc[i, 'annotation'] = 0
    
    # Preprocess text
    df['content_without_stopwords'] = df['content'].apply(
        lambda x: ' '.join([word for word in x.split() if word not in stop])
    )
    df['content_without_puncs'] = df['content_without_stopwords'].apply(
        lambda x: regex.sub('', x)
    )
    
    # Stemming
    tok_list = []
    for text in df['content_without_puncs']:
        nltk_tokens = nltk.word_tokenize(text)
        final = ''
        for w in nltk_tokens:
            final = final + ' ' + porter_stemmer.stem(w)
        tok_list.append(final)
    
    df['content_tokenize'] = tok_list
    
    # Remove numbers
    noNums = []
    for text in df['content_tokenize']:
        noNums.append(''.join([i for i in text if not i.isdigit()]))
    
    df['content'] = noNums
    
    # Create and fit TF-IDF vectorizer
    vectorizer = TfidfVectorizer(use_idf=True, sublinear_tf=True)
    X = vectorizer.fit_transform(df.content.tolist())
    y = np.array(df.annotation.tolist())
    
    # Train Random Forest model
    model = RandomForestClassifier(n_estimators=100, n_jobs=-1)
    model.fit(X, y)
    
    # Save both model and vectorizer
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    with open(VECTORIZER_PATH, 'wb') as f:
        pickle.dump(vectorizer, f)
    
    return model, vectorizer

def load_or_train_model():
    global model, vectorizer
    
    # Check if saved models exist
    if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
        print("Loading existing model...")
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(VECTORIZER_PATH, 'rb') as f:
            vectorizer = pickle.load(f)
    else:
        print("No existing model found. Training new model...")
        model, vectorizer = train_and_save_model()
    
    print("Model ready!")

def preprocess_text(text):
    # Remove stopwords
    text_without_stopwords = ' '.join([word for word in text.split() if word not in stop])
    
    # Remove punctuation
    text_without_puncs = regex.sub('', text_without_stopwords)
    
    # Stemming
    nltk_tokens = nltk.word_tokenize(text_without_puncs)
    stemmed_text = ' '.join([porter_stemmer.stem(w) for w in nltk_tokens])
    
    # Remove numbers
    text_without_nums = ''.join([i for i in stemmed_text if not i.isdigit()])
    
    return text_without_nums

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        # Preprocess the input text
        processed_text = preprocess_text(data['text'])
        
        # Transform text using the fitted vectorizer
        text_vectorized = vectorizer.transform([processed_text])
        
        # Make prediction
        prediction = model.predict(text_vectorized)[0]
        
        return jsonify({
            'prediction': int(prediction),
            'is_cyberbullying': bool(prediction == 1)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Initializing server...")
    load_or_train_model()
    print("Starting server...")
    app.run(port=5002, host='0.0.0.0')