# Common API

In this documentation, we will focus on the common API. This module includes the core of BatchJS. This API allows you to create your own custom jobs and steps using the common interface.

------------

<!--Auto generated Documentation PLEASE DO NOT MODIFY THIS FILE. MODIFY THE JSDOC INSTEAD-->

## Table of Contents

  - [PostgresBatchEntityReader](#postgresbatchentityreader)
  - [PostgresBatchEntityWriter](#postgresbatchentitywriter)

## PostgresBatchEntityReader

`extends AbstractBatchEntityReaderStream` 

Class that reads data in batches of a specified size using PostgreSQL cursors.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the PostgresBatchEntityReader. | PostgresBatchEntityReaderOptions |
  | **options.pool** | The PostgreSQL connection pool. | Pool |
  | **options.query** | SQL query to be executed (without LIMIT and OFFSET). | string |



### fetch (function)

`protected` 

Fetches a batch of data using a PostgreSQL cursor.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size of the batch to fetch. | number |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;BatchData.&lt;T&gt;&gt; | A promise that resolves with the batch of data. |


### initializeCursor (function)

`private` 

Initializes the cursor for the query if not already initialized.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;{cursorName:string, client:PoolClient}&gt; | A promise that resolves when the cursor is initialized. |


### closeCursor (function)

`private` 

Closes the cursor and releases the client connection.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A promise that resolves when the cursor is closed. |


### _destroy (function)



Destroys the reader by closing the cursor and releasing resources.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **error** | The error that caused the destruction. | Error, null |
  | **callback** | The callback function to be executed after destruction. | function |


## PostgresBatchEntityWriter

`extends AbstractBatchEntityWriterStream` 

Class that writes data in batches of a specified size in PostgreSQL databases.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the PostgresBatchEntityWriter. | PostgresBatchEntityWriterOptions |
  | **options.pool** | The PostgreSQL connection pool. | Pool |



### batchWrite (function)

`protected` 

Writes a batch of data to the storage.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **chunk** | The batch of data to write to the storage. | BatchData.&lt;T&gt; |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; |  |


