FROM docker.io/library/node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache git
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
ARG EXPO_PUBLIC_API_URL=https://api.novateam.tech
ARG EXPO_PUBLIC_PASSWORD_SECRET=nova_premium_pepper_2026_x77
ARG EXPO_PUBLIC_MOBILE_API_KEY=NC-1415969ce95efbe2eb99ee6356369431ee7ada0a8c501389
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_PASSWORD_SECRET=$EXPO_PUBLIC_PASSWORD_SECRET
ENV EXPO_PUBLIC_MOBILE_API_KEY=$EXPO_PUBLIC_MOBILE_API_KEY
RUN npx expo export -p web

FROM docker.io/library/nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

