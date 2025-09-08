# Common API

In this documentation, we will focus on the common API. This module includes the core of BatchJS. This API allows you to create your own custom jobs and steps using the common interface.

------------

<!--Auto generated Documentation PLEASE DO NOT MODIFY THIS FILE. MODIFY THE JSDOC INSTEAD-->

## Table of Contents

  - [AbstractBatchEntityReaderStream](#abstractbatchentityreaderstream)
  - [AbstractBatchEntityWriterStream](#abstractbatchentitywriterstream)

## AbstractBatchEntityReaderStream

`extends ObjectReadable` 

Class that enable to implement classes to read data in batches of a specified size in different types of data storage.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the AbstractBatchEntityReaderStream. | AbstractBatchEntityReaderStreamOptions |
  | **options.batchSize** | The maximum number of elements in a batch. | number |



### _read (function)



Reads a batch of data from the data storage and pushes it to the consumer stream.
If the size parameter is not specified, it reads the number of entities specified in the batchSize option.
If the size parameter is specified, it reads the minimum of the size and the batchSize option.
If no data is available, it pushes null to the consumer stream to signal that the end of the stream has been reached.
If an error occurs while reading data, it emits an error event to the stream.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size parameter for controlling the read operation. | number |


### _flush (function)

`private` 

Flushes the buffer by pushing its content to the consumer stream. If the consumer stream is not ready to receive data, it waits for the drain event and flushes the buffer again when it is emitted.
This function is recursive and will keep flushing the buffer until it is empty.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A promise that resolves when the buffer is flushed. |


## AbstractBatchEntityWriterStream

`extends ObjectWritable` 

Class that enable to implement classes to write data in batches of a specified size in different types of data storage.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the AbstractBatchEntityWriterStream. | AbstractBatchEntityWriterStreamOptions |
  | **options.batchSize** | The maximum number of elements in a batch. | number |



### _write (function)



A method to write data to the stream, push the chunk to the buffer, and execute the callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The data chunk to write to the stream. | T |
  | **encoding** | The encoding of the data. | BufferEncoding |
  | **callback** | The callback function to be executed after writing the data. | WriteCallback |


### _final (function)



Finalizes the stream by pushing remaining data batches, handling errors,
and executing the final callback.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **callback** | The callback function to be executed after finalizing the stream. | WriteCallback |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | This function does not return anything. |


### _flush (function)

`private` 

Creates a batch of data from the buffer and flushes it to the storage.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; |  |


