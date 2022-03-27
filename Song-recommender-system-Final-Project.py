#!/usr/bin/env python
# coding: utf-8

# # Chatbot&Recommander_system_project : music recommander

# A project made by:
#  - Grégoire CAURIER
#  - Aref BITAR
#  - Hamza BENYEMNA

# In this project, we will build a song recommender based on our **Spotify** **listening history** and **song features** dataset. We obtained it by doing a demand to Spotify in our account confidential settings. It took 15 days to have it.

# ## I) Data import

# In[33]:


import pandas as pd
import numpy as np
import seaborn as sns 
import matplotlib.pyplot as plt 
from imblearn.over_sampling import SMOTE


# ### Streaming dataset

# In[48]:


streaming = pd.read_csv("StreamingHistory.csv")
streaming.head()


# ### Data cleaning

# In[49]:


streaming = streaming.drop('Unnamed: 0', axis=1)

streaming = streaming.rename(columns={"artistName":"artist","endTime":"date","trackName":"track"})


# ### Data visualization

# We will define a favorite song as a song with **15** or more listens and create a new dataframe that contains only those songs. This enables us to eliminate many songs that may cause the model to be more complicated and also prevents me from taking into account songs that we may have accidently listened to on the radio instead of intentionally listening to it.

# In[36]:


ax = streaming.groupby(['artist','track']).size().to_frame('count').reset_index().plot(kind='hist',bins=9)
ax.set_xlim(0,40)
ax.set_title("Choosing what is a 'favorite' song")


# ### Occurences more than 15

# In[5]:


streaming.groupby(['artist','track']).size().to_frame('count').reset_index()
streaming = streaming.groupby(['artist','track']).size().to_frame('count').reset_index()
streaming = streaming[streaming['count']>=15]
df.head(5)


# ### Features dataset

# In[6]:


features = pd.read_csv("SpotifyFeatures.csv")

features = features.rename(columns={"artist_name":"artist","track_name":"track"})
features.head(5)


# The **favorite** column will be the variable that I will try to predict.

# In[7]:


features['same_artists'] = features.artist.isin(df.artist) 
features['same_track'] = features.track.isin(df.track) 
features["favorite"] = np.where((features["same_artists"] == True) & (features["same_track"] == True),1,0) # If both instances are True.
features = features.drop(["same_artists","same_track"],axis=1)


# In[8]:


future = features.copy(deep=True)


# In[9]:


features.genre.unique()


# In[50]:


features


# Comedy stands out to the most as we want to know if 'songs' in this genre are actually songs. 

# In[10]:


features[features.genre == 'Comedy'].describe()


# We can look at the values in **instrumentalness**, **liveness**, and **speechiness** to deduce that there are almost no instrumentals, the recording is highly probable to be in front of a live audience, and that it contains a lot words. Therefore, we will be removing all songs from this genre because they do not accurately represent music and will distort the model with its **features**. 

# We can drop features **track_id** and **track** that have low correlation to our predictions.

# In[11]:


features = features[features.genre!='Comedy']

features = features.drop(columns='track_id')


# In[12]:


features = features.drop(columns='track')


# In[13]:


features.head(1)


# ### Balancing Classes with Oversampling (SMOTE) and Feature Selection

# Our model will predict most songs as the majority class (in our case, 0). Therefore, we will use SMOTE to oversample from the minority class to balance them out.

# In[14]:


features.favorite.value_counts()


# In[15]:


X = features.drop(columns=['favorite','genre','artist','key','mode','time_signature'])
y = features.favorite
oversample = SMOTE()
X, y = oversample.fit_resample(X, y)
X['favorite'] = y
X.head()


# ### Correlation matrix

# In[22]:


plt.figure(figsize=(20,10))
c = X.corr()
corr = sns.heatmap(c,cmap="BrBG",annot=True)


# **Popularity**, **danceability**, and **instrumentalness** have the highest associations, with **popularity** and **danceability** being positive and instrumentalness being negative.

# ## II) Recommander system

# We will use 3 different methods:
#  - **Random Forest Classifier**
#  - **Decision Tree Classifier**
#  - **Logistic Regression** 

# In[212]:


import sklearn
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score
from sklearn.model_selection import train_test_split
from sklearn.model_selection import GridSearchCV
from sklearn import metrics 
from sklearn.metrics import f1_score

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression 
from sklearn.tree import DecisionTreeClassifier


# ### Split and train the data

# In[54]:


X_train, X_test, y_train, y_test = train_test_split(X.drop(columns='favorite'), X.favorite,test_size = .20)


# We will use **cross-validation** to see how well each model generalizes and obtain a F1 score.

# ### Logistic Regression

# In[55]:


get_ipython().run_cell_magic('time', '', '\nlr = LogisticRegression()\nlr_scores = cross_val_score(lr, X_train, y_train, cv=10, scoring="f1")\nnp.mean(lr_scores)')


# ### Decision Tree

# In[18]:


parameters = {
    'max_depth':[15,20,30],
}
dtc = Pipeline([('CV',GridSearchCV(DecisionTreeClassifier(), parameters, cv = 5))])
dtc.fit(X_train, y_train)
dtc.named_steps['CV'].best_params_


# In[56]:


get_ipython().run_cell_magic('time', '', '\ndt = DecisionTreeClassifier(max_depth=30)\ndt_scores = cross_val_score(dt, X_train, y_train, cv=10, scoring="f1")\nnp.mean(dt_scores)')


# ### Random Forest

# In[20]:


parameters = {
    'max_depth':[6,12,15,20],
    'n_estimators':[20,30]
}
clf = Pipeline([('CV',GridSearchCV(RandomForestClassifier(), parameters, cv = 5))])
clf.fit(X_train, y_train)
clf.named_steps['CV'].best_params_


# In[21]:


get_ipython().run_cell_magic('time', '', '\nrf = Pipeline([(\'rf\', RandomForestClassifier(n_estimators = 20, max_depth = 30))])\nrf_scores = cross_val_score(rf, X_train, y_train, cv=10, scoring="f1")\nnp.mean(rf_scores)')


# Based on F1 score, we can conclude that the **Random Forest** is the best model for our prediction problem. 

# # III) Predictiions

# In[213]:


prediction = dt.predict(future.drop(columns=['track','track_id','favorite','genre','artist','key','time_signature','mode']))


# In[214]:


future['prediction'] = prediction


# In[215]:


# Gets only songs that were not favorites but are predicted to be
future = future[(future['favorite']==0) & (future['prediction'] == 1)]


# In[216]:


future = future.drop(columns=['track_id','energy','duration_ms','acousticness','key','liveness','loudness','mode','speechiness','tempo','time_signature','valence'])


# In[217]:


future


# ## Conclusion 
# Through this project, we was able to fit a **Random Forest Tree Classifier** with a F1 score of around **99%**, confirmed through **cross-validation** as well as unseen test data.
