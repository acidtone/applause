import { computeBufferSize } from '../helpers/compute-buffer-size';
import { filterBuffer } from '../helpers/filter-buffer';
import { interceptConnections } from '../helpers/intercept-connections';
function divide(a, b) {
    const denominator = b[0] * b[0] + b[1] * b[1];
    return [(a[0] * b[0] + a[1] * b[1]) / denominator, (a[1] * b[0] - a[0] * b[1]) / denominator];
}
function multiply(a, b) {
    return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}
function evaluatePolynomial(coefficient, z) {
    let result = [0, 0];
    for (let i = coefficient.length - 1; i >= 0; i -= 1) {
        result = multiply(result, z);
        result[0] += coefficient[i];
    }
    return result;
}
export const createNativeIIRFilterNodeFakerFactory = (createInvalidAccessError, createInvalidStateError, createNativeScriptProcessorNode, createNotSupportedError) => {
    return (nativeContext, baseLatency, { channelCount, channelCountMode, channelInterpretation, feedback, feedforward }) => {
        const bufferSize = computeBufferSize(baseLatency, nativeContext.sampleRate);
        const convertedFeedback = feedback instanceof Float64Array ? feedback : new Float64Array(feedback);
        const convertedFeedforward = feedforward instanceof Float64Array ? feedforward : new Float64Array(feedforward);
        const feedbackLength = convertedFeedback.length;
        const feedforwardLength = convertedFeedforward.length;
        const minLength = Math.min(feedbackLength, feedforwardLength);
        if (feedbackLength === 0 || feedbackLength > 20) {
            throw createNotSupportedError();
        }
        if (convertedFeedback[0] === 0) {
            throw createInvalidStateError();
        }
        if (feedforwardLength === 0 || feedforwardLength > 20) {
            throw createNotSupportedError();
        }
        if (convertedFeedforward[0] === 0) {
            throw createInvalidStateError();
        }
        if (convertedFeedback[0] !== 1) {
            for (let i = 0; i < feedforwardLength; i += 1) {
                convertedFeedforward[i] /= convertedFeedback[0];
            }
            for (let i = 1; i < feedbackLength; i += 1) {
                convertedFeedback[i] /= convertedFeedback[0];
            }
        }
        const scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, bufferSize, channelCount, channelCount);
        scriptProcessorNode.channelCount = channelCount;
        scriptProcessorNode.channelCountMode = channelCountMode;
        scriptProcessorNode.channelInterpretation = channelInterpretation;
        const bufferLength = 32;
        const bufferIndexes = [];
        const xBuffers = [];
        const yBuffers = [];
        for (let i = 0; i < channelCount; i += 1) {
            bufferIndexes.push(0);
            const xBuffer = new Float32Array(bufferLength);
            const yBuffer = new Float32Array(bufferLength);
            xBuffer.fill(0);
            yBuffer.fill(0);
            xBuffers.push(xBuffer);
            yBuffers.push(yBuffer);
        }
        // tslint:disable-next-line:deprecation
        scriptProcessorNode.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer;
            const outputBuffer = event.outputBuffer;
            const numberOfChannels = inputBuffer.numberOfChannels;
            for (let i = 0; i < numberOfChannels; i += 1) {
                const input = inputBuffer.getChannelData(i);
                const output = outputBuffer.getChannelData(i);
                bufferIndexes[i] = filterBuffer(convertedFeedback, feedbackLength, convertedFeedforward, feedforwardLength, minLength, xBuffers[i], yBuffers[i], bufferIndexes[i], bufferLength, input, output);
            }
        };
        const nyquist = nativeContext.sampleRate / 2;
        const nativeIIRFilterNodeFaker = {
            get bufferSize() {
                return bufferSize;
            },
            get channelCount() {
                return scriptProcessorNode.channelCount;
            },
            set channelCount(value) {
                scriptProcessorNode.channelCount = value;
            },
            get channelCountMode() {
                return scriptProcessorNode.channelCountMode;
            },
            set channelCountMode(value) {
                scriptProcessorNode.channelCountMode = value;
            },
            get channelInterpretation() {
                return scriptProcessorNode.channelInterpretation;
            },
            set channelInterpretation(value) {
                scriptProcessorNode.channelInterpretation = value;
            },
            get context() {
                return scriptProcessorNode.context;
            },
            get inputs() {
                return [scriptProcessorNode];
            },
            get numberOfInputs() {
                return scriptProcessorNode.numberOfInputs;
            },
            get numberOfOutputs() {
                return scriptProcessorNode.numberOfOutputs;
            },
            addEventListener(...args) {
                // @todo Dissallow adding an audioprocess listener.
                return scriptProcessorNode.addEventListener(args[0], args[1], args[2]);
            },
            dispatchEvent(...args) {
                return scriptProcessorNode.dispatchEvent(args[0]);
            },
            getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
                if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) {
                    throw createInvalidAccessError();
                }
                const length = frequencyHz.length;
                for (let i = 0; i < length; i += 1) {
                    const omega = -Math.PI * (frequencyHz[i] / nyquist);
                    const z = [Math.cos(omega), Math.sin(omega)];
                    const numerator = evaluatePolynomial(convertedFeedforward, z);
                    const denominator = evaluatePolynomial(convertedFeedback, z);
                    const response = divide(numerator, denominator);
                    magResponse[i] = Math.sqrt(response[0] * response[0] + response[1] * response[1]);
                    phaseResponse[i] = Math.atan2(response[1], response[0]);
                }
            },
            removeEventListener(...args) {
                return scriptProcessorNode.removeEventListener(args[0], args[1], args[2]);
            }
        };
        return interceptConnections(nativeIIRFilterNodeFaker, scriptProcessorNode);
    };
};
//# sourceMappingURL=native-iir-filter-node-faker-factory.js.map