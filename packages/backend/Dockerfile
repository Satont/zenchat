# Stage 2: Create minimal runtime image
FROM debian:bookworm-slim AS runner

WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the compiled binary from builder
COPY .out/backend /app/backend

# Expose the port your backend listens on
EXPOSE 3000

# Run the binary
CMD ["./backend"]
