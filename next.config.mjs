import withPWA from '@ducanh2912/next-pwa';

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.externals.push({
            'sharp': 'commonjs sharp',
            'onnxruntime-node': 'commonjs onnxruntime-node'
        })
        return config
    }
};

export default withPWAConfig(nextConfig);
