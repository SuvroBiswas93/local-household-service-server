# Local Household Service Server

[![Node.js](https://img.shields.io/badge/Node.js-16+-green)](https://nodejs.org/) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-blue)](https://www.mongodb.com/)

A REST API server for managing household services and bookings, built with **Node.js**, **Express**, and **MongoDB**.

## Features

- **Services:** CRUD operations, reviews, top-rated services, filtering by price or provider
- **Bookings:** Add, delete, and fetch bookings; prevent duplicates and self-booking
- **Authentication checks:** Only service owners can update/delete their services
- **CORS & JSON support** for cross-origin requests

## API Endpoints

### Services
- `GET /services` – List services (filters: `minPrice`, `maxPrice`, `providerEmail`)  
- `GET /services/top-rated` – Top 6 rated services  
- `GET /services/:id` – Single service details  
- `POST /services` – Add new service  
- `PUT /services/:id` – Update service (owner only)  
- `DELETE /services/:id` – Delete service (owner only)  
- `POST /services/:id/reviews` – Add a review  

### Bookings
- `GET /bookings` – List bookings (filter by `userEmail`)  
- `POST /bookings` – Add booking  
- `DELETE /bookings/:id` – Delete booking  

## Quick Start

```bash
git clone https://github.com/yourusername/local-household-service-server.git
cd local-household-service-server
npm install
```

## Create .env file:

- MONGODB_URI=your_mongodb_connection_string
- PORT=3000

## Run server:
```bash
nodemon index.js
```