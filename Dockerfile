FROM ruby:2.5.8

# install fastlane
RUN gem install fastlane

# install node.js
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

# install yarn
# RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
# RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
# RUN apt-get update && apt-get install yarn

############################################

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
#RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 3047
CMD ["node", "poll-itc.js"]



