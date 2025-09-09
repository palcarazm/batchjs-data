# Common API

In this documentation, we will focus on the common API. This module includes the core of BatchJS. This API allows you to create your own custom jobs and steps using the common interface.

------------

<!--Auto generated Documentation PLEASE DO NOT MODIFY THIS FILE. MODIFY THE JSDOC INSTEAD-->

## Table of Contents

  - [MariadbBatchEntityReader](#mariadbbatchentityreader)
  - [MariadbBatchEntityWriter](#mariadbbatchentitywriter)

## MariadbBatchEntityReader

`extends AbstractBatchEntityReaderStream` 

Class that read data in batches of a specified size in Mariadb databases.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the MariadbBatchEntityReader. | MariadbBatchEntityReaderOptions |
  | **options.pool** | The MariadbQL connection pool. | Pool |
  | **options.query** | SQL query to be executed (without LIMIT and OFFSET). | string |
  | **options.rowToEntity** | Function that converts a row to an entity. | function |



### fetch (function)

`private` 

Fetches a batch of data from the database.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **size** | The size of the batch to fetch. | number |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;BatchData.&lt;T&gt;&gt; | A promise that resolves with the batch of data. |


### _destroy (function)

`private` 

Destroys the writer by finalizing the statement used to read entities and
closing the database connection. This method should be called when the
writer is no longer needed to free up resources.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **error** | The error that caused the destruction. | Error, null |
  | **callback** | The callback function to be executed after destroying the reader. | ReadCallback |


### connectDatabase (function)

`private` 

Connects to the database by creating a new database connection if none
already exists, or by reusing an existing connection.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;PoolConnection&gt; | A promise that resolves with the database connection. |


### disconnectDatabase (function)



Disconnects from the database by closing the active database connection
and setting the connection reference to null. This method should be called
when the reader is no longer needed to free up resources.

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;void&gt; | A promise that resolves when the database connection
is successfully closed. |


### prepareStatement (function)

`private` 

Prepares a statement for fetching entities. If the statement has already been
prepared, it is reused.

  #### Parameters
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **db** | The database connection. | Mariadb.Database |

  #### Returns
  | Type       | Description                             |
  |------------|-----------------------------------------|
  | Promise.&lt;Mariadb.Statement&gt; | The prepared statement. |


### finalizeStatement (function)

`private` 

Finalizes the statement used to fetch entities. This method should be
called when the reader is no longer needed to free up resources.


## MariadbBatchEntityWriter

`extends AbstractBatchEntityWriterStream` 

Class that writes data in batches of a specified size in MariadbQL databases.



  ### Constructor
  | Name       | Description                             | Type                         |
  |------------|-----------------------------------------|------------------------------|
  | **options** | The options for the MariadbBatchEntityWriter. | MariadbBatchEntityWriterOptions |
  | **options.pool** | The MariadbQL connection pool. | Pool |
  | **options.prepareStatement** | Insert SQL prepared statement to be executed. | String |
  | **options.entityToRow** | Function that converts an entity to a row. | function |



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


